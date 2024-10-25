import * as moment from 'moment-timezone';

export interface UserAvailabilityTimeSlotInterface {
  durations: number[];
  day: number;
  startTime: moment.Moment;
  endTime: moment.Moment;
}
