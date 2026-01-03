import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CacheService } from '../../infrastructure/cache/cache.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { OutboxService } from '../../infrastructure/messaging/outbox.service';

@Injectable()
export class RegistrationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
    private readonly outboxService: OutboxService,
  ) {}

  private async ensureCancellationColumn() {
    try {
      // MySQL 8+ supports IF NOT EXISTS; best-effort to avoid runtime mismatch
      await this.prisma.$executeRawUnsafe(
        'ALTER TABLE registrations ADD COLUMN IF NOT EXISTS cancellation_count INT NOT NULL DEFAULT 0',
      );
    } catch (_err) {
      // Ignore if not supported or already present; migration should handle formally
    }
  }

  private async getCancellationCount(eventId: number, userId: number): Promise<number> {
    const rows = await this.prisma.$queryRawUnsafe<Array<{ cancellation_count: number }>>( 
      'SELECT cancellation_count FROM registrations WHERE event_id = ? AND user_id = ? LIMIT 1',
      eventId,
      userId,
    );
    return rows[0]?.cancellation_count ?? 0;
  }

  async registerForEvent(eventId: number, userId: number) {
    const event = await this.prisma.event.findUnique({ where: { event_id: eventId } });
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.created_by === userId) {
      throw new ForbiddenException('Creators cannot register their own event');
    }

    const existing = await this.prisma.registration.findUnique({
      where: { event_id_user_id: { event_id: eventId, user_id: userId } },
    });
    if (existing) {
      // Nếu đã huỷ quá 3 lần thì không cho đăng ký lại
      if (existing.status === 'cancelled') {
        await this.ensureCancellationColumn();
        const cancellationCount = await this.getCancellationCount(eventId, userId);
        if (cancellationCount >= 3) {
          throw new ForbiddenException('Bạn đã huỷ 3 lần, không thể đăng ký lại');
        }

        const qr = `QR-${eventId}-${userId}-${randomUUID()}`;
        await this.prisma.$executeRawUnsafe(
          'UPDATE registrations SET status = ?, qr_code = ? WHERE registration_id = ?',
          'registered',
          qr,
          existing.registration_id,
        );

        const updated = await this.prisma.registration.findUnique({
          where: { registration_id: existing.registration_id },
          select: {
            registration_id: true,
            event_id: true,
            user_id: true,
            status: true,
            qr_code: true,
            checked_in_at: true,
            created_at: true,
          },
        });

        await this.cacheService.del(`events:${eventId}:registrations`);
        return updated;
      }

      throw new ConflictException('Already registered');
    }

    const qr = `QR-${eventId}-${userId}-${randomUUID()}`;

    const created = await this.prisma.registration.create({
      data: {
        qr_code: qr,
        event: { connect: { event_id: eventId } },
        user: { connect: { user_id: userId } },
      },
      select: {
        registration_id: true,
        event_id: true,
        user_id: true,
        status: true,
        qr_code: true,
        created_at: true,
      },
    });

    await this.cacheService.del(`events:${eventId}:registrations`);

    // Emit registration created event
    await this.outboxService.enqueue({
      routingKey: 'registration.created',
      aggregateType: 'registration',
      aggregateId: created.registration_id,
      payload: {
        registration_id: created.registration_id,
        event_id: created.event_id,
        user_id: created.user_id,
        status: created.status,
        qr_code: created.qr_code,
        created_at: created.created_at,
      },
    });

    return created;
  }

  async cancelRegistration(eventId: number, userId: number) {
    const existing = await this.prisma.registration.findUnique({
      where: { event_id_user_id: { event_id: eventId, user_id: userId } },
    });

    if (!existing) {
      throw new NotFoundException('Registration not found');
    }

    if (existing.status !== 'registered') {
      throw new ConflictException('Chỉ có thể huỷ khi đang ở trạng thái registered');
    }

    await this.ensureCancellationColumn();
    await this.prisma.$executeRawUnsafe(
      'UPDATE registrations SET status = ?, cancellation_count = cancellation_count + 1 WHERE registration_id = ?',
      'cancelled',
      existing.registration_id,
    );

    const updated = await this.prisma.registration.findUnique({
      where: { registration_id: existing.registration_id },
      select: {
        registration_id: true,
        event_id: true,
        user_id: true,
        status: true,
        qr_code: true,
        checked_in_at: true,
        created_at: true,
      },
    });

    if (!updated) {
      throw new NotFoundException('Registration not found after cancel');
    }

    await this.cacheService.del(`events:${eventId}:registrations`);

    // Emit registration cancelled event
    await this.outboxService.enqueue({
      routingKey: 'registration.cancelled',
      aggregateType: 'registration',
      aggregateId: updated.registration_id,
      payload: {
        registration_id: updated.registration_id,
        event_id: updated.event_id,
        user_id: updated.user_id,
        status: updated.status,
        qr_code: updated.qr_code,
        checked_in_at: updated.checked_in_at,
        created_at: updated.created_at,
      },
    });

    return updated;
  }
}