import * as moment from 'moment-timezone';

export function findPossibleDurations(
  startTime: moment.Moment,
  endTime: moment.Moment,
  durations: number[],
  strictDuration?: number,
): number[] {
  let possibleDurations = []; // Initialize an array to hold possible durations

  // Iterate through each duration option provided
  durations.forEach((item) => {
    const duration = moment.duration(endTime.diff(startTime)); // Calculate the total duration between start and end times
    const minutes = duration.asMinutes(); // Convert the duration to minutes

    // Check if the current item (duration) is less than or equal to the total minutes
    if (item <= minutes) {
      const remainder = minutes % item; // Calculate the remainder when total minutes are divided by the item
      if (remainder >= 0) {
        possibleDurations.push(item); // Add the item to possible durations if it fits
      }
    }
  });

  // If a strict duration is provided, filter possible durations to include only that duration
  if (strictDuration) {
    possibleDurations = possibleDurations.filter((p) => p === strictDuration);
  }

  return possibleDurations; // Return the array of possible durations
}
