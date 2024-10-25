import { AvailabilityDateRangeInterface } from './available-date-range.interface';
import { DateRangeInterface } from './date-range.interface';

export interface BaseCalendarInterface {
  startDate: string;
  endDate: string;
  unavailable: DateRangeInterface[];
  available: AvailabilityDateRangeInterface[];
}
