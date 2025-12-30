import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MessageIdempotencyService {
  private readonly logger = new Logger(MessageIdempotencyService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns true if the message is new for this consumer; false if already processed.
   */
  async ensure(messageId: string, consumer: string): Promise<boolean> {
    if (!messageId) {
      return true; // nothing to guard
    }

    try {
      await this.prisma.messageConsumption.create({
        data: { consumer, message_id: messageId },
      });
      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        // duplicate unique (consumer, message_id)
        this.logger.debug(`Duplicate message skipped consumer=${consumer} messageId=${messageId}`);
        return false;
      }
      throw error;
    }
  }
}
