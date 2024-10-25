import {
  IsArray,
  IsOptional,
  ValidateNested,
  IsString,
  IsNumber,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { UserAvailabilityTimeSlotDto } from './user-availability-time-slot.dto';
import { Type } from 'class-transformer';
import { MeetingType } from '@aldb2b/common';

export class UpdateUserAvailabilityDto {
  @IsArray()
  @IsOptional()
  durations?: number[];

  @IsString()
  @IsOptional()
  link?: string;

  @IsNumber()
  @IsOptional()
  timeZone?: number;

  @IsString()
  @IsOptional()
  timeZoneName?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UserAvailabilityTimeSlotDto)
  userAvailabilityTimeSlots?: UserAvailabilityTimeSlotDto[];

  @IsNumber()
  @IsOptional()
  preMeetingReminder?: number;

  @IsBoolean()
  @IsOptional()
  primary?: boolean;

  @IsOptional()
  @IsEnum(MeetingType)
  meetingType?: MeetingType;

  @IsString()
  @IsOptional()
  location?: string;

  @IsNumber()
  @IsOptional()
  viewCount?: number;

  @IsNumber()
  @IsOptional()
  scheduledMeetingCount?: number;
}
