import { Matches, IsEnum } from 'class-validator';
import { UserAvailabilityDay } from '../enums/user-availability-day.enum';
import { regExpTime } from '@aldb2b/common';

export class UserAvailabilityTimeSlotDto {
  @IsEnum(UserAvailabilityDay)
  day: UserAvailabilityDay;

  @Matches(regExpTime)
  startTime: string;

  @Matches(regExpTime)
  endTime: string;
}
