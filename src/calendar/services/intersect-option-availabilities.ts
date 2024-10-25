import { UserAvailability } from '../entities/user-availability.schema';
import {
  availabilityEveryDays,
  availabilityWeekDays,
  availabilityWeekends,
} from '../consts';
import { UserAvailabilityDay } from '../enums/user-availability-day.enum';

export function intersectOptionAvailabilities(
  userAvailabilities: UserAvailability[],
): UserAvailability[] {
  // Check if there are any user availabilities provided
  if (userAvailabilities && userAvailabilities.length) {
    // Iterate through each user's availability
    userAvailabilities.forEach((userAvailability) => {
      // Check if the user has defined availability time slots
      if (
        userAvailability.userAvailabilityTimeSlots &&
        userAvailability.userAvailabilityTimeSlots.length
      ) {
        // Filter out time slots that are available every day
        const optionAvailabilityTimeSlots =
          userAvailability.userAvailabilityTimeSlots.filter(
            (timeSlot) =>
              availabilityEveryDays.includes(timeSlot.day) === false,
          );
        // If there are option time slots available
        if (optionAvailabilityTimeSlots && optionAvailabilityTimeSlots.length) {
          const optionSlots = []; // Array to hold generated time slots
          // Iterate through each filtered time slot
          for (let i = 0; i < optionAvailabilityTimeSlots.length; i++) {
            const optionAvailabilityTimeSlot = optionAvailabilityTimeSlots[i];
            let slots = []; // Array to hold slots generated for the specific day
            // Generate slots based on the type of availability
            switch (optionAvailabilityTimeSlot.day) {
              case UserAvailabilityDay.EVERY_DAY:
                // Generate slots for every day
                slots = generateSlotByDays(
                  availabilityEveryDays,
                  optionAvailabilityTimeSlot.startTime,
                  optionAvailabilityTimeSlot.endTime,
                );
                break;

              case UserAvailabilityDay.WEEK_DAYS:
                // Generate slots for weekdays
                slots = generateSlotByDays(
                  availabilityWeekDays,
                  optionAvailabilityTimeSlot.startTime,
                  optionAvailabilityTimeSlot.endTime,
                );
                break;

              case UserAvailabilityDay.WEEK_ENDS:
                // Generate slots for weekends
                slots = generateSlotByDays(
                  availabilityWeekends,
                  optionAvailabilityTimeSlot.startTime,
                  optionAvailabilityTimeSlot.endTime,
                );
                break;
              default:
                break; // No action for unrecognized day types
            }
            // Add generated slots to the optionSlots array
            optionSlots.push(...slots);
          }
          // Append the generated option slots to the user's availability time slots
          userAvailability.userAvailabilityTimeSlots.push(...optionSlots);

          // Filter the user's availability time slots to keep only those available every day
          userAvailability.userAvailabilityTimeSlots =
            userAvailability.userAvailabilityTimeSlots.filter((timeSlot) =>
              availabilityEveryDays.includes(timeSlot.day),
            );
        }
      }
    });
  }
  return userAvailabilities; // Return the updated user availabilities
}

// Function to generate time slots for specified days
const generateSlotByDays = (
  days: UserAvailabilityDay[],
  startTime: string,
  endTime: string,
) => {
  return days.map((day) => {
    return {
      day: day,
      startTime: startTime,
      endTime: endTime,
    };
  });
};
