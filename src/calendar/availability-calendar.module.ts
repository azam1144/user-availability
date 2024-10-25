import { Module } from '@nestjs/common';
import { AvailabilityCalendarController } from './controllers/availability-calendar.controller';
import { CalendarService } from './services/calendar.service';
import { CalendarBase } from './services/calendar-base.service';
import { EventTimestampService } from './services/event-timestamp.service';
import { GroupIntersect } from './services/group-intersect.service';
import { GroupMessageBroker } from './rpcs/group-message-broker';
import { UnavailabilityIntersect } from './services/unavailability-intersect.service';
import { UserAvailabilityService } from './services/user-availability.services';
import { UserAvailabilityRepository } from './repositories/user-availability.repository';

@Module({
  imports: [],
  controllers: [AvailabilityCalendarController],
  providers: [
    CalendarService,
    CalendarBase,
    EventTimestampService,
    GroupIntersect,
    GroupMessageBroker,
    UnavailabilityIntersect,
    UserAvailabilityService,
    UserAvailabilityRepository,
  ],
  exports: [
    CalendarService,
    UserAvailabilityService,
    UserAvailabilityRepository,
  ],
})
export class AvailabilityCalendarModule {}
