import * as moment from 'moment-timezone';
import { extendMoment } from 'moment-range';
import { findPossibleDurations } from './find-possible-durations';
import { BaseCalendarInterface } from '../interfaces/base-calendar.interface';
import { UserAvailabilityTimeSlotInterface } from '../interfaces/user-availability-time-slot.interface';

const momentRange = extendMoment(moment);

export function updateBaseCalendarByTimeSlots(
  baseCalendar: BaseCalendarInterface,
  intersectedTimeSlots: UserAvailabilityTimeSlotInterface[],
  includeUnavailablities: boolean,
  returnDurations: boolean,
  duration: number,
  finalBaseCalendar?: BaseCalendarInterface,
): BaseCalendarInterface {
  // Initialize finalBaseCalendar if not provided
  if (finalBaseCalendar === undefined) {
    finalBaseCalendar = {
      startDate: baseCalendar.startDate, // Set start date from base calendar
      endDate: baseCalendar.endDate, // Set end date from base calendar
      available: [],
      unavailable: baseCalendar.unavailable, // Copy unavailable slots from base calendar
    };
  }

  // Check if there are available time slots in the base calendar
  if (baseCalendar.available && baseCalendar.available.length) {
    for (let i = 0; i < baseCalendar.available.length; i++) {
      // Get the day of the week for the current available slot
      const availableDay = moment(baseCalendar.available[i].startDate)
        .toDate()
        .getDay();

      // Filter user availabilities for the specific day
      const speceficDayUserAvailabilities = intersectedTimeSlots.filter(
        (userAvailability) => userAvailability.day === availableDay,
      );

      // If there are user availabilities for the day
      if (
        speceficDayUserAvailabilities &&
        speceficDayUserAvailabilities.length
      ) {
        for (let j = 0; j < speceficDayUserAvailabilities.length; j++) {
          const userAvailability = speceficDayUserAvailabilities[j];

          // Convert available start and end dates to UTC
          const availableStartDate = moment(
            baseCalendar.available[i].startDate,
          ).utc();
          const availableEndDate = moment(
            baseCalendar.available[i].endDate,
          ).utc();
          const userAvailabilityStartTime = userAvailability.startTime;
          const userAvailabilityEndTime = userAvailability.endTime;

          // Calculate the difference in days to align user availability with available slots
          const startDiff = availableStartDate
            .clone()
            .startOf('day')
            .diff(userAvailabilityStartTime.clone().startOf('day'), 'days');
          userAvailabilityStartTime.add(startDiff, 'days');

          // Calculate end difference and adjust user availability end time
          let endDiff = availableEndDate
            .clone()
            .startOf('day')
            .diff(userAvailabilityEndTime.clone().startOf('day'), 'days');
          endDiff =
            endDiff >= startDiff ? endDiff : endDiff + (startDiff - endDiff);
          userAvailabilityEndTime.add(endDiff, 'days');

          // Create ranges for available and user availability
          const availabileRange = momentRange.range(
            availableStartDate,
            availableEndDate,
          );
          const userAvailabilityRange = momentRange.range(
            userAvailabilityStartTime,
            userAvailabilityEndTime,
          );

          // Check for intersection between available range and user availability range
          const intersect = availabileRange.intersect(userAvailabilityRange);
          if (intersect) {
            // Find possible durations for the intersection
            const possibleDurations = findPossibleDurations(
              intersect.start,
              intersect.end,
              userAvailability.durations,
              duration,
            );

            // If possible durations exist or we are not returning durations
            if (
              (possibleDurations && possibleDurations.length) ||
              returnDurations == false
            ) {
              // Add the intersected time slot to the final base calendar
              if (returnDurations) {
                finalBaseCalendar.available.push({
                  startDate: intersect.start.toDate(),
                  endDate: intersect.end.toDate(),
                  durations: possibleDurations, // Include possible durations
                });
              } else {
                finalBaseCalendar.available.push({
                  startDate: intersect.start.toDate(),
                  endDate: intersect.end.toDate(),
                });
              }

              // Subtract user availability from the available range
              const subtract = availabileRange.subtract(userAvailabilityRange);
              if (subtract && subtract.length) {
                baseCalendar.available.push(
                  ...subtract.map((item) => {
                    return {
                      startDate: moment(item.start.toDate()).utc(),
                      endDate: moment(item.end.toDate()).utc(),
                    };
                  }),
                );
              }

              // Remove the processed available slot from base calendar
              baseCalendar.available.splice(i, 1);
              // Recursively call the function to continue processing
              return updateBaseCalendarByTimeSlots(
                baseCalendar,
                intersectedTimeSlots,
                includeUnavailablities,
                returnDurations,
                duration,
                finalBaseCalendar,
              );
            }
          }
        }
      }

      // If including unavailability, add the current available slot to unavailable
      if (includeUnavailablities) {
        finalBaseCalendar.unavailable.push(baseCalendar.available[i]);
      }

      // Remove the processed available slot from base calendar
      baseCalendar.available.splice(i, 1);
      // Recursively call the function to continue processing
      return updateBaseCalendarByTimeSlots(
        baseCalendar,
        intersectedTimeSlots,
        includeUnavailablities,
        returnDurations,
        duration,
        finalBaseCalendar,
      );
    }
  }

  // Return the final updated base calendar
  return finalBaseCalendar;
}
