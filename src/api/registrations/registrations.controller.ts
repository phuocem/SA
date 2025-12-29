import { Controller, Post, Param, Body } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Controller('events')
export class RegistrationsController {
  constructor(private readonly prisma: PrismaService) {}

  //  POST của register đăng kí sự kiện 
  //   /events/1/register
  // ko được xóa comment
  @Post(':eventId/register')
  async register(
    @Param('eventId') eventId: string,
    @Body('userId') userId: number,
  ) {
    const qr = `QR-${eventId}-${userId}-${Date.now()}`;

    return this.prisma.registration.create({
      data: {
        event_id: +eventId,
        user_id: userId,
        qr_code: qr,
      },
    });
  }
}