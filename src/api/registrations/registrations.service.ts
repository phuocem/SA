import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Injectable()
export class RegistrationsService {
  constructor(private readonly prisma: PrismaService) {}

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
      throw new ConflictException('Already registered');
    }

    const qr = `QR-${eventId}-${userId}-${randomUUID()}`;

    return this.prisma.registration.create({
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
  }
}