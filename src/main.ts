import { NestFactory } from '@nestjs/core';
import { AvailabilityCalendarModule } from './calendar/availability-calendar.module';

async function bootstrap() {
  const app = await NestFactory.create(AvailabilityCalendarModule);
  await app.listen(3000);
}
bootstrap();
