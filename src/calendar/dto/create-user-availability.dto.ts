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

export class CreateUserAvailabilityDto {
  @IsArray()
  @IsOptional()
  durations: number[];

  @IsString()
  link: string;

  @IsNumber()
  @IsOptional()
  timeZone: number;

  @IsString()
  @IsOptional()
  timeZoneName: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UserAvailabilityTimeSlotDto)
  userAvailabilityTimeSlots: UserAvailabilityTimeSlotDto[];

  @IsNumber()
  @IsOptional()
  preMeetingReminder: number;

  @IsBoolean()
  @IsOptional()
  primary?: boolean;

  @IsOptional()
  @IsEnum(MeetingType)
  meetingType?: MeetingType;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  contactId?: string;
}
