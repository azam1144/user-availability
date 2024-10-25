import { IsOptional, IsString, IsBoolean, IsMongoId } from 'class-validator';

export class ValidateLinkRequestDto {
  @IsString()
  link: string;

  @IsBoolean()
  @IsOptional()
  suggestion?: boolean;

  @IsMongoId()
  @IsOptional()
  userAvailabilityId?: string;
}
