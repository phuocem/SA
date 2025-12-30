import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Query,
  Param,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { Authenticated } from '../auth/decorators/authenticated.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get('keyword')
  @ApiOperation({ summary: 'Tìm kiếm sự kiện theo keyword (có phân trang)' })
  @ApiQuery({ name: 'page', required: false, example: 1, description: 'Trang (mặc định 1)' })
  @ApiQuery({ name: 'size', required: false, example: 10, description: 'Số bản ghi mỗi trang (mặc định 10)' })
  @ApiQuery({ name: 'keyword', required: false, example: 'meetup', description: 'Từ khoá tìm kiếm' })
  async findAll(
    @Query('page') page = '1',
    @Query('size') size = '10',
    @Query('keyword') keyword?: string,
  ) {
    const pageNum = +page || 1;
    const sizeNum = +size || 10;
    return this.eventsService.findAll(pageNum, sizeNum, keyword, false);
  }

  @Get('me')
  @ApiBearerAuth()
  @Authenticated()
  @ApiOperation({ summary: 'Lấy sự kiện do chính mình tạo (có phân trang)' })
  @ApiQuery({ name: 'page', required: false, example: 1, description: 'Trang (mặc định 1)' })
  @ApiQuery({ name: 'size', required: false, example: 10, description: 'Số bản ghi mỗi trang (mặc định 10)' })
  @ApiQuery({ name: 'keyword', required: false, example: 'meetup', description: 'Từ khoá tìm kiếm' })
  async findMine(
    @Query('page') page = '1',
    @Query('size') size = '10',
    @Query('keyword') keyword: string | undefined,
    @CurrentUser() user: any,
  ) {
    const pageNum = +page || 1;
    const sizeNum = +size || 10;
    return this.eventsService.findMine(user?.user_id, pageNum, sizeNum, keyword, false);
  }

  @Get('me/all')
  @ApiBearerAuth()
  @Authenticated()
  @ApiOperation({ summary: 'Lấy tất cả sự kiện do chính mình tạo (không phân trang)' })
  async findMineAll(
    @CurrentUser() user: any,
  ) {
    return this.eventsService.findMine(user?.user_id, 1, 0, undefined, true);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy tất cả sự kiện (không phân trang)' })
  async findAllNoPaging() {
    return this.eventsService.findAll(1, 0, undefined, true);
  }
  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết sự kiện' })
  @ApiParam({ name: 'id', type: Number, description: 'Event ID' })
  async findOne(@Param('id') id: string) {
    const eventId = parseInt(id, 10);
    if (isNaN(eventId)) throw new BadRequestException('ID phải là số');

    const event = await this.eventsService.findOne(eventId);
    if (!event) throw new NotFoundException(`Event ${id} không tồn tại`);

    const registrations = await this.eventsService.getRegistrations(eventId);

    return {
      ...event,
      status: String(event.status),
      registrations,
    };
  }

  @Post()
  @ApiBearerAuth()
  @Authenticated()
  @ApiOperation({ summary: 'Tạo sự kiện mới' })
  @ApiBody({ type: CreateEventDto })
  async create(@Body() body: CreateEventDto, @CurrentUser() user: any) {
    return this.eventsService.create(body, user?.user_id);
  }

  @Put(':id')
  @ApiBearerAuth()
  @Authenticated()
  @ApiOperation({ summary: 'Cập nhật sự kiện' })
  @ApiParam({ name: 'id', type: Number, description: 'Event ID' })
  @ApiBody({ type: UpdateEventDto })
  async update(@Param('id') id: string, @Body() body: UpdateEventDto, @CurrentUser() user: any) {
    const eventId = parseInt(id, 10);
    return this.eventsService.update(eventId, body, user?.user_id);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @Authenticated()
  @ApiOperation({ summary: 'Xoá sự kiện' })
  @ApiParam({ name: 'id', type: Number, description: 'Event ID' })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    const eventId = parseInt(id, 10);
    return this.eventsService.remove(eventId, user?.user_id);
  }
}