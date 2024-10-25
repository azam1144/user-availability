import {
  UserAvailability,
  UserAvailabilityTimeSlot,
} from '../entities/user-availability.schema';
import { intersection } from 'lodash';
import * as moment from 'moment-timezone';
import { extendMoment } from 'moment-range';
import { findPossibleDurations } from './find-possible-durations';
import { UserAvailabilityDay } from '../enums/user-availability-day.enum';
import { UserAvailabilityTimeSlotInterface } from '../interfaces/user-availability-time-slot.interface';

const momentRange = extendMoment(moment);

// Calculate the intersection of user availability time slots
export function calculateTimeSlotsIntersection(
  userAvailabilities: UserAvailability[],
  intersectedTimeSlots?: UserAvailabilityTimeSlotInterface[],
  stopIntersection?: boolean,
): UserAvailabilityTimeSlotInterface[] {
  // Stop further calculations if the flag is set
  if (stopIntersection) {
    return [];
  }

  // Process user availabilities if available
  if (userAvailabilities && userAvailabilities.length) {
    // Get the user's availability durations, defaulting to 15 minutes if not specified
    const userAvailabilityDurations =
      userAvailabilities[0].durations && userAvailabilities[0].durations.length
        ? userAvailabilities[0].durations
        : [15];

    // Convert time slots to UTC based on user's time zone
    const timeSlots = convertTimeSlotsToUTC(
      userAvailabilities[0].userAvailabilityTimeSlots,
      userAvailabilities[0].timeZone,
      userAvailabilityDurations,
    );

    // If time slots are available, proceed to calculate intersections
    if (timeSlots && timeSlots.length) {
      userAvailabilities = userAvailabilities.slice(1); // Move to the next user availability
      if (intersectedTimeSlots && intersectedTimeSlots.length) {
        // Intersect the current time slots with previously intersected time slots
        intersectedTimeSlots = intersectTimeSlots(
          intersectedTimeSlots,
          timeSlots,
        );
        // Recursively calculate intersections until no more time slots are left
        return calculateTimeSlotsIntersection(
          userAvailabilities,
          intersectedTimeSlots,
          intersectedTimeSlots && intersectedTimeSlots.length ? false : true,
        );
      } else {
        // Start the intersection calculation with the first user's time slots
        return calculateTimeSlotsIntersection(
          userAvailabilities,
          timeSlots,
          false,
        );
      }
    } else {
      return []; // Return empty if no time slots are available
    }
  } else {
    // Return the intersected time slots if no user availabilities are left
    return intersectedTimeSlots && intersectedTimeSlots.length
      ? intersectedTimeSlots
      : [];
  }
}

// Find the intersection of old and new time slots
function intersectTimeSlots(
  oldTimeSlots: UserAvailabilityTimeSlotInterface[],
  newTimeSlots: UserAvailabilityTimeSlotInterface[],
) {
  const intersectedTimeSlots = [];
  // Loop through new time slots to find intersections with old time slots
  for (let i = 0; i < newTimeSlots.length; i++) {
    for (let j = 0; j < oldTimeSlots.length; j++) {
      if (newTimeSlots[i].day === oldTimeSlots[j].day) {
        // Create moment ranges for comparison
        const newRange = momentRange.range(
          newTimeSlots[i].startTime,
          newTimeSlots[i].endTime,
        );
        const oldRange = momentRange.range(
          oldTimeSlots[j].startTime,
          oldTimeSlots[j].endTime,
        );
        const intersect = newRange.intersect(oldRange); // Find intersection

        if (intersect) {
          // Find possible durations for the intersected time slot
          const newPossibleDurations = findPossibleDurations(
            intersect.start,
            intersect.end,
            newTimeSlots[i].durations,
          );
          const oldPossibleDurations = findPossibleDurations(
            intersect.start,
            intersect.end,
            oldTimeSlots[j].durations,
          );

          // If both have possible durations, calculate the intersection
          if (
            newPossibleDurations &&
            newPossibleDurations.length &&
            oldPossibleDurations &&
            oldPossibleDurations.length
          ) {
            const intersectionDurations = intersection(
              newPossibleDurations,
              oldPossibleDurations,
            );
            const bestDuration = Math.max(
              Math.min(...newPossibleDurations),
              Math.min(...oldPossibleDurations),
            );

            // Create an intersected time slot with the best duration
            const intersectedTimeslot = {
              startTime: intersect.start.utc(),
              endTime: intersect.end.utc(),
              day: newTimeSlots[i].day,
              durations: [...new Set([bestDuration, ...intersectionDurations])],
            };
            intersectedTimeSlots.push(intersectedTimeslot); // Add to the result
          }
        }
      }
    }
  }

  return intersectedTimeSlots; // Return the list of intersected time slots
}

// Convert user availability time slots to UTC format
function convertTimeSlotsToUTC(
  timeSlots: UserAvailabilityTimeSlot[],
  timeZone?: number,
  durations?: number[],
): UserAvailabilityTimeSlotInterface[] {
  if (timeSlots && timeSlots.length) {
    const convertedTimeslots = [];
    // Convert each time slot based on the user's time zone
    timeSlots.forEach((timeSlot) => {
      const day = getDayNumber(timeSlot.day); // Get the corresponding day number
      let startTime = moment(timeSlot.startTime, 'HH:mm');
      let endTime = moment(timeSlot.endTime, 'HH:mm');

      // Adjust start and end times based on the time zone
      if (timeZone > 0) {
        startTime = startTime.subtract(timeZone, 'minutes').utc();
        endTime = endTime.subtract(timeZone, 'minutes').utc();
      } else if (timeZone < 0) {
        startTime = startTime.add(Math.abs(timeZone), 'minutes').utc();
        endTime = endTime.add(Math.abs(timeZone), 'minutes').utc();
      } else {
        startTime = startTime.utc();
        endTime = endTime.utc();
      }

      // Find possible durations for the converted time slot
      const possibleDurartions = findPossibleDurations(
        startTime,
        endTime,
        durations,
      );

      // If possible durations exist, create a converted time slot object
      if (possibleDurartions && possibleDurartions.length) {
        const convertedTimeslot = {
          startTime: startTime,
          endTime: endTime,
          day: day,
          durations: possibleDurartions,
        };
        convertedTimeslots.push(convertedTimeslot); // Add to the list
      }
    });
    return convertedTimeslots; // Return the list of converted time slots
  }
}

// Get the numeric representation of the day
function getDayNumber(day: string): number {
  return Object.values(UserAvailabilityDay).findIndex((item) => item === day);
}
