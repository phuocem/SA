import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CacheService } from '../../infrastructure/cache/cache.service';
import { OutboxService } from '../../infrastructure/messaging/outbox.service';

@Injectable()
export class EventsService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
    private outboxService: OutboxService,
  ) {}

  async findAll(page = 1, size = 10, keyword?: string, showAll = false) {
    const cacheKey = `events:list:${page}:${size}:${keyword || 'all'}:${showAll ? 'all' : 'page'}`;
    
    // Try to get from cache (TTL: 2 minutes)
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const useAll = !!showAll;
        const skip = useAll ? undefined : (page - 1) * size;
        const take = useAll ? undefined : size;
        const trimmed = typeof keyword === 'string' ? keyword.trim() : undefined;
        const keywordNumber = trimmed && !Number.isNaN(Number(trimmed)) ? Number(trimmed) : undefined;
        const where = trimmed
          ? {
              OR: [
                { name: { contains: trimmed } },
                { description: { contains: trimmed } },
                ...(keywordNumber !== undefined ? [{ event_id: keywordNumber }] : []),
              ],
            }
          : undefined;

        const [data, total] = await Promise.all([
          this.prisma.event.findMany({
            where,
            skip,
            take,
            include: { creator: { select: { name: true } } },
            orderBy: { start_time: 'desc' },
          }),
          this.prisma.event.count({ where }),
        ]);

        return { data, total, page: useAll ? 1 : +page, size: useAll ? total : +size };
      },
      120000, // 2 minutes
    );
  }

  async findOne(id: number) {
    const cacheKey = `events:${id}`;
    
    // Try to get from cache (TTL: 5 minutes)
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        return this.prisma.event.findUnique({
          where: { event_id: id },
          include: { creator: { select: { name: true, email: true } } },
        });
      },
      300000, // 5 minutes
    );
  }

  async getRegistrations(eventId: number) {
    const cacheKey = `events:${eventId}:registrations`;
    
    // Try to get from cache (TTL: 1 minute for frequently changing data)
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        // DÙNG $queryRaw ĐỂ TRÁNH PRISMA ÉP KIỂU ENUM → AN TOÀN TUYỆT ĐỐI
        const result = await this.prisma.$queryRaw<
          Array<{
            registration_id: number;
            status: string;
            qr_code: string | null;
            checked_in_at: Date | null;
            name: string;
            email: string;
          }>
        >`
          SELECT 
            r.registration_id,
            CAST(r.status AS CHAR) as status,
            r.qr_code,
            r.checked_in_at,
            u.name,
            u.email
          FROM registrations r
          JOIN users u ON r.user_id = u.user_id
          WHERE r.event_id = ${eventId}
        `;

        return result.map(r => ({
          registration_id: r.registration_id,
          status: r.status,
          qr_code: r.qr_code,
          checked_in_at: r.checked_in_at,
          user: { name: r.name, email: r.email },
        }));
      },
      60000, // 1 minute
    );
  }

  async create(data: any, userId?: number) {
    const payload = data ?? {};
    const created_by = userId ?? (payload.created_by ? Number(payload.created_by) : 1);

    // Basic required field validation to avoid Prisma runtime errors
    const missing = ['name', 'start_time', 'end_time'].filter((k) => !payload[k]);
    if (missing.length) {
      throw new BadRequestException(`Thiếu trường bắt buộc: ${missing.join(', ')}`);
    }

    const event = await this.prisma.$transaction(async (tx) => {
      const created = await tx.event.create({
        data: { ...payload, created_by },
        include: { creator: { select: { name: true } } },
      });

      await this.outboxService.enqueue(
        {
          routingKey: 'event.created',
          aggregateType: 'event',
          aggregateId: created.event_id,
          payload: {
            event_id: created.event_id,
            name: created.name,
            start_time: created.start_time.toISOString(),
            end_time: created.end_time.toISOString(),
          },
        },
        tx,
      );

      return created;
    });
    
    // Invalidate list cache
    await this.cacheService.delPattern('events:list:*');
    
    return event;
  }

  async update(id: number, data: any, userId?: number) {
    const existing = await this.prisma.event.findUniqueOrThrow({ where: { event_id: id } });
    if (userId && existing.created_by !== userId) {
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa sự kiện này');
    }

    const event = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.event.update({
        where: { event_id: id },
        data,
        include: { creator: { select: { name: true } } },
      });

      await this.outboxService.enqueue(
        {
          routingKey: 'event.updated',
          aggregateType: 'event',
          aggregateId: updated.event_id,
          payload: {
            event_id: updated.event_id,
            name: updated.name,
            start_time: updated.start_time.toISOString(),
            end_time: updated.end_time.toISOString(),
          },
        },
        tx,
      );

      return updated;
    });
    
    // Invalidate specific event cache and list cache
    await this.cacheService.del(`events:${id}`);
    await this.cacheService.delPattern('events:list:*');
    
    return event;
  }

  async remove(id: number, userId?: number) {
    const existing = await this.prisma.event.findUniqueOrThrow({ where: { event_id: id } });
    if (userId && existing.created_by !== userId) {
      throw new ForbiddenException('Bạn không có quyền xoá sự kiện này');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.event.delete({ where: { event_id: id } });

      await this.outboxService.enqueue(
        {
          routingKey: 'event.deleted',
          aggregateType: 'event',
          aggregateId: id,
          payload: { event_id: id },
        },
        tx,
      );
    });
    
    // Invalidate specific event cache and list cache
    await this.cacheService.del(`events:${id}`);
    await this.cacheService.del(`events:${id}:registrations`);
    await this.cacheService.delPattern('events:list:*');
    
    return { message: `Event ${id} đã được loại bỏ thành công` };
  }
}