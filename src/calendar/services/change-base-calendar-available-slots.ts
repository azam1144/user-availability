import * as moment from 'moment-timezone';
import { BaseCalendarInterface } from '../interfaces/base-calendar.interface';

// Change the available time slots in the base calendar based on user input
export function changeBaseCalendarAvailableSlots(
  baseCalendar: BaseCalendarInterface,
  fromTime: string,
  toTime: string,
  speceficDates?: Date[],
): BaseCalendarInterface {
  // Check if the base calendar has available slots
  if (baseCalendar.available && baseCalendar.available.length) {
    // Proceed if both fromTime and toTime are provided
    if (fromTime && toTime) {
      // Convert user-provided times to UTC moments
      const userStartTime = moment(fromTime, 'HH:mm')
        .set({ second: 0, millisecond: 0 })
        .utc();
      const userEndTime = moment(toTime, 'HH:mm')
        .set({ second: 0, millisecond: 0 })
        .utc();

      // Update each available slot's start and end times
      baseCalendar.available.forEach((item) => {
        const availableStartDate = moment(item.startDate).utc();
        const availableEndDate = moment(item.endDate).utc();
        // Set the hours and minutes based on user input
        availableStartDate.set('hour', userStartTime.hours());
        availableStartDate.set('minute', userStartTime.minutes());
        availableEndDate.set('hour', userEndTime.hours());
        availableEndDate.set('minute', userEndTime.minutes());

        // Update the item with the new start and end dates
        item.startDate = availableStartDate.toDate();
        item.endDate = availableEndDate.toDate();
      });
    }

    // If specific dates are provided, filter the available slots
    if (speceficDates && speceficDates.length) {
      const finalAvailabilities = [];
      // Loop through each specific date
      for (let i = 0; i < speceficDates.length; i++) {
        const speceficDate = moment(speceficDates[i]).startOf('day').utc();
        // Check each available slot against the specific date
        for (let j = 0; j < baseCalendar.available.length; j++) {
          const availableStartDate = moment(baseCalendar.available[j].startDate)
            .startOf('day')
            .utc();
          const availableEndDate = moment(baseCalendar.available[j].endDate)
            .startOf('day')
            .utc();
          // If the specific date matches the start or end date, add it to final availabilities
          if (
            speceficDate.isSame(availableStartDate) ||
            speceficDate.isSame(availableEndDate)
          ) {
            finalAvailabilities.push(baseCalendar.available[j]);
            break; // Break to avoid adding the same slot multiple times
          }
        }
      }
      // Update the available slots in the base calendar with the filtered results
      baseCalendar.available = finalAvailabilities;
    }
  }

  return baseCalendar; // Return the updated base calendar
}
