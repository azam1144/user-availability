import { regExpTime } from '@aldb2b/common';
import {
  IsArray,
  IsOptional,
  IsMongoId,
  IsDateString,
  IsBoolean,
  IsNumber,
  IsString,
  Matches,
} from 'class-validator';

export class GetCalenderDto {
  @IsNumber()
  @IsOptional()
  page?: number;

  @IsMongoId()
  @IsOptional()
  eventId?: string;

  @IsMongoId()
  @IsOptional()
  contactId?: string;

  @IsArray()
  @IsOptional()
  hostIds?: string[];

  @IsArray()
  @IsOptional()
  guestIds?: string[];

  @IsMongoId()
  @IsOptional()
  hostCompanyId?: string;

  @IsMongoId()
  @IsOptional()
  guestCompanyId?: string;

  @IsDateString()
  @IsOptional()
  userStartDate?: string;

  @IsDateString()
  @IsOptional()
  userEndDate?: string;

  @IsBoolean()
  @IsOptional()
  meetingHubEvent?: boolean;

  @IsString()
  @IsOptional()
  token?: string;

  @IsString()
  @IsOptional()
  link?: string;

  @IsMongoId()
  @IsOptional()
  hallId?: string;

  @Matches(regExpTime)
  @IsOptional()
  fromTime?: string;

  @Matches(regExpTime)
  @IsOptional()
  toTime?: string;

  @IsNumber()
  @IsOptional()
  duration?: number;

  @IsArray()
  @IsOptional()
  speceficDates?: Date[];
}
