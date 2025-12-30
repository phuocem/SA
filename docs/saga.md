# Saga nhẹ / Luồng nhiều bước

Helper saga gọn để điều phối các bước có hành động bù trừ.

## Khi nào dùng
Dùng saga khi luồng nghiệp vụ có nhiều bước cần thành công tất cả hoặc được bù trừ (vd: tạo record → phát event → gọi API khác).

## API
- `SagaStep`: `{ name, action(ctx), compensate?(ctx, error) }`
- `Saga`: `new Saga(steps).run(ctx)` trả `{ success, error?, executed, compensated, context }`.

## Ví dụ
```typescript
import { Saga } from '../infrastructure/saga/saga';

interface FlowCtx { eventId?: number; ticketId?: number; }

const saga = new Saga<FlowCtx>([
  {
    name: 'create-event',
    action: async (ctx) => {
      const event = await prisma.event.create({ data: { name: 'Demo', start_time: new Date(), end_time: new Date() } });
      ctx.eventId = event.event_id;
    },
    compensate: async (ctx) => {
      if (ctx.eventId) await prisma.event.delete({ where: { event_id: ctx.eventId } });
    },
  },
  {
    name: 'enqueue-outbox',
    action: async (ctx) => {
      await outbox.enqueue({
        routingKey: 'event.created',
        aggregateType: 'event',
        aggregateId: ctx.eventId!,
        payload: { event_id: ctx.eventId },
      });
    },
  },
]);

const result = await saga.run({});
if (!result.success) {
  // xử lý lỗi / hiển thị ra ngoài
}
```

## Mẫu khuyến nghị
- **Compensation idempotent**: hành động bù trừ phải an toàn khi gọi nhiều lần.
- **Outbox trước**: enqueue sau khi ghi chính nhưng vẫn trong transaction nếu có thể.
- **Metrics/logging**: dùng `executed` và `compensated` để log/giám sát.

## Ghi chú
- Helper này cố ý tối giản; saga dài hạn nên dùng workflow engine bền.
- Giữ action nhanh; việc nặng hãy đẩy sang message handler qua outbox.
