import * as moment from 'moment';
import { extendMoment } from 'moment-range';
import { ConflictException, Injectable } from '@nestjs/common';
import { DateRangeInterface } from '../interfaces/date-range.interface';
import { BaseCalendarInterface } from '../interfaces/base-calendar.interface';
import { HeaderUser } from '@aldb2b/common';
import { __ as translate } from '@squareboat/nestjs-localization';

const momentRange = extendMoment(moment);

@Injectable()
export class CalendarBase {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}

  // Validate if the user's date range is valid
  validateUserDateRange(
    userDateRange: DateRangeInterface,
    header?: HeaderUser,
  ) {
    // Check if start date is after end date
    if (new Date(userDateRange.startDate) > new Date(userDateRange.endDate))
      throw new ConflictException(
        translate(`User's provided Date Range is in valid`, header?.language),
      );

    // Uncommented: Check if start date is in the past
    /*
      if (new Date(userDateRange.startDate) < new Date())
        throw new ConflictException(
          translate(`User's provided Date Range is in valid`, header?.language),
        );
    */
  }

  // Set the start and end date based on user input and event date range
  setStartAndEndDate(
    userDateRange: DateRangeInterface,
    eventDateRange: DateRangeInterface,
    header: HeaderUser,
  ) {
    this.validateUserDateRange(userDateRange, header);

    // If user start date is in the past, set it to now
    if (new Date(userDateRange.startDate) < new Date())
      userDateRange.startDate = new Date();

    // Adjust user end date if it exceeds event's end date
    if (new Date(userDateRange.endDate) > new Date(eventDateRange.endDate))
      userDateRange.endDate = eventDateRange.endDate;

    // Validate if user date range is within the event's date range
    if (
      new Date(userDateRange.endDate) > new Date(eventDateRange.endDate) ||
      new Date(userDateRange.endDate) < new Date(eventDateRange.startDate)
    )
      throw new ConflictException(
        translate(
          `User's Date Range is out of Event's on-boarding date range`,
          header.language,
        ),
      );

    return userDateRange;
  }

  // Calculate the start and end dates from an array of timestamps
  getStartAndEndDate(timestamps: DateRangeInterface[], header?: HeaderUser) {
    const today = new Date();
    let startDate = timestamps[0].startDate;
    let endDate = timestamps[timestamps.length - 1].endDate;

    // Check if event has already closed
    if (new Date(endDate) < today)
      throw new ConflictException(
        translate(`Event is closed`, header?.language),
      );

    // Adjust start date if it is in the past
    if (new Date(startDate) < today) {
      if (
        timestamps[0].endDate > today &&
        new Date(timestamps[0].endDate) >
          moment(today).add(5, 'minutes').toDate()
      ) {
        startDate = moment(today).add(5, 'minutes'); // Set to 5 minutes from now
      } else {
        // Find the next available start date
        for (const timestamp of timestamps) {
          if (new Date(timestamp.startDate) >= today) {
            startDate = timestamp.startDate;
            break;
          } else if (
            new Date(timestamp.endDate) > today &&
            new Date(timestamp.endDate) >
              moment(today).add(5, 'minutes').toDate()
          ) {
            startDate = moment(today).add(5, 'minutes');
            break;
          }
        }
      }
    }

    // Ensure end date is at least 10 days after start date
    if (new Date(endDate) < moment(startDate).add(10, 'days').toDate())
      endDate = moment(startDate).add(10, 'days');

    return { startDate, endDate };
  }

  // Compute the base calendar based on event date ranges
  computeBaseCalendar(
    startDate: string,
    endDate: string,
    eventDateRanges: DateRangeInterface[],
    onlyDates: string[] = [],
  ) {
    const baseCalendar = Object.create({});
    baseCalendar.startDate = startDate;
    baseCalendar.endDate = endDate;
    baseCalendar.unavailable = [];
    baseCalendar.available = [];

    // Convert onlyDates to moment objects for easier comparison
    let momentOnlyDates = [];
    if (onlyDates && onlyDates.length) {
      momentOnlyDates = onlyDates.map((date) =>
        moment(date).utc().startOf('day'),
      );
    }

    // Check for overlaps between event dates and base calendar
    for (const eventDateRange of eventDateRanges) {
      const eStartDate = momentRange.utc(eventDateRange.startDate);
      const eEndDate = momentRange.utc(eventDateRange.endDate);
      const bStartDate = momentRange.utc(startDate);
      const bEndDate = momentRange.utc(endDate);

      const eRange = momentRange.range(eStartDate, eEndDate);
      const bRange = momentRange.range(bStartDate, bEndDate);

      const isOverlap = eRange.overlaps(bRange); // Check if ranges overlap
      if (isOverlap) {
        const startDate = bStartDate > eStartDate ? bStartDate : eStartDate; // Determine the later start date
        const endDate = eEndDate; // Use event's end date

        // If specific dates are provided, check against them
        if (momentOnlyDates && momentOnlyDates.length) {
          const date = startDate.clone().startOf('day');
          if (
            momentOnlyDates.some((momentOnlyDate) =>
              momentOnlyDate.isSame(date),
            )
          ) {
            baseCalendar.available.push({
              startDate: startDate,
              endDate: endDate,
            });
          }
        } else {
          baseCalendar.available.push({
            startDate: startDate,
            endDate: endDate,
          });
        }
      }

      // Sort available dates if any are found
      if (baseCalendar.available.length > 0) {
        baseCalendar.available.sort(
          (a, b) => (a.startDate > b.endDate && 1) || 1,
        );
      }
    }
    return baseCalendar; // Return the computed base calendar
  }

  // Mark all slots as unavailable based on event timestamps
  setUnavailableToAllSlots(
    baseCalendar: BaseCalendarInterface,
    eventTimestamps: DateRangeInterface[],
  ) {
    baseCalendar.available = []; // Clear available slots
    for (const eventTimestamp of eventTimestamps) {
      // Only consider future events
      if (new Date(eventTimestamp.startDate) >= new Date()) {
        baseCalendar.unavailable.push({
          startDate: eventTimestamp.startDate,
          endDate: eventTimestamp.endDate,
        });
      }
    }
    return baseCalendar; // Return updated base calendar
  }
}
