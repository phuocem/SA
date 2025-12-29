import { BadRequestException, Body, Controller, Param, Post, UnauthorizedException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Authenticated } from '../auth/decorators/authenticated.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RegistrationsService } from './registrations.service';

@ApiTags('Registrations')
@Controller('events')
export class RegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) {}

  //  POST của register đăng kí sự kiện 
  //   /events/1/register
  // ko được xóa comment
  @Post(':eventId/register')
  @ApiBearerAuth()
  @Authenticated()
  @ApiOperation({ summary: 'Đăng ký tham gia sự kiện' })
  @ApiParam({ name: 'eventId', type: Number, description: 'ID của sự kiện' })
  async register(
    @Param('eventId') eventId: string,
    @CurrentUser() user: any,
    // Body kept for potential future expansion but user identity comes from token
    @Body() _body?: any,
  ) {
    const eventIdNum = Number(eventId);
    if (!Number.isInteger(eventIdNum) || eventIdNum <= 0) {
      throw new BadRequestException('eventId is invalid');
    }

    const userId = user?.user_id;
    if (!userId) {
      throw new UnauthorizedException('Login required');
    }

    return this.registrationsService.registerForEvent(eventIdNum, userId);
  }
}