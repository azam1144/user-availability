import { UserAvailabilityTimeSlotDto } from '../dto/user-availability-time-slot.dto';
import * as moment from 'moment-timezone';

export function validateTimeslots(timeslots?: UserAvailabilityTimeSlotDto[]) {
  if (timeslots && timeslots.length) {
    const timeslotsToValidate = timeslots.map((item) => {
      return {
        day: item.day,
        startTime: moment(item.startTime, 'HH:mm'),
        endTime: moment(item.endTime, 'HH:mm'),
      };
    });

    return checkTimeslotsValidation(timeslotsToValidate);
  }
}

function checkTimeslotsValidation(remainingTimeslots: any[]): boolean | void {
  if (remainingTimeslots && remainingTimeslots.length) {
    const timeslot = remainingTimeslots[0];
    remainingTimeslots = remainingTimeslots.slice(1);
    if (timeslot.startTime.isAfter(timeslot.endTime)) {
      return false;
    }
    if (
      remainingTimeslots.some(
        (item) =>
          timeslot.day === item.day &&
          (timeslot.startTime.isBetween(item.startTime, item.endTime) ||
            timeslot.endTime.isBetween(item.startTime, item.endTime) ||
            timeslot.startTime.isSame(item.startTime) ||
            timeslot.endTime.isSame(item.endTime) ||
            timeslot.endTime.isSame(item.startTime)),
      )
    ) {
      return false;
    }
    return checkTimeslotsValidation(remainingTimeslots);
  } else {
    return true;
  }
}
