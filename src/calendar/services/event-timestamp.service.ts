import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import * as Moment from 'moment';
import { extendMoment } from 'moment-range';
import { HeaderUser } from '@aldb2b/common';
import { EventServices } from '../../event/services/event.services';
import { DateRangeInterface } from '../interfaces/date-range.interface';
import { __ as translate } from '@squareboat/nestjs-localization';
const momentRange = extendMoment(Moment);

@Injectable()
export class EventTimestampService {
  constructor(protected eventServices: EventServices) {}

  // Fetch event timestamps and check for existence
  async getEventTimestamps(eventId: string, header: HeaderUser) {
    const event = await this.getEventById(eventId, header);
    // If no timestamps exist, throw an error
    if (Array.isArray(event.timestamps) && event.timestamps.length === 0)
      throw new NotFoundException(
        translate(`This Event haven't timestamps`, header.language),
      );
    return event.timestamps; // Return the found timestamps
  }

  // Validate provided timestamps against existing event timestamps
  validateTimestamps(
    timestamps: DateRangeInterface[],
    startTime: Date,
    endTime: Date,
    header: HeaderUser,
    pastMeeting: boolean = false,
  ) {
    this.validateDateRange(startTime, endTime, header, pastMeeting); // Validate date range

    const today = new Date();
    const endDate = timestamps[timestamps.length - 1].endDate;

    // Check if the event is closed based on the current date and pastMeeting flag
    if (new Date(endDate) < today && !pastMeeting)
      return {
        status: false,
        message: translate(`This Event is closed`, header.language),
      };

    // Set up moment ranges for validation
    const mStartDate = momentRange.utc(startTime);
    const mEndDate = momentRange.utc(endTime);

    // Check for overlapping timestamps
    for (const timestamp of timestamps) {
      const eStartDate = momentRange.utc(timestamp.startDate);
      const eEndDate = momentRange.utc(timestamp.endDate);
      const eRange = momentRange.range(eStartDate, eEndDate);
      const startDateOverlap = eRange.contains(mStartDate);
      const endDateOverlap = eRange.contains(mEndDate);
      // Return if overlaps are found
      if (startDateOverlap && endDateOverlap) {
        return {
          status: true,
          message: translate(`Timestamp is overlapped`, header.language),
        };
      }
    }
    // Return if no overlaps are detected
    return {
      status: false,
      message: translate(
        `Meeting startTime and endTime are not overlapping to Event timestamps`,
        header.language,
      ),
    };
  }

  // Validate the date range for start and end times
  private validateDateRange(
    startDate: Date,
    endDate: Date,
    header: HeaderUser,
    pastMeeting: boolean | false,
  ): void {
    // Check if startDate is greater than endDate
    if (new Date(startDate) > new Date(endDate))
      throw new ConflictException(
        translate(
          `Invalid date range, End date should be greater than start date`,
          header.language,
        ),
      );

    // Check if start date is in the past
    if (new Date(startDate) < new Date() && !pastMeeting)
      throw new ConflictException(
        translate(
          `Invalid start date, it should be greater than current time`,
          header.language,
        ),
      );

    // Check if end date is in the past
    if (new Date(endDate) < new Date() && !pastMeeting)
      throw new ConflictException(
        translate(
          `Invalid end date, it should be greater than current time`,
          header.language,
        ),
      );
  }

  // Compute event timestamps for a given page of timestamps
  computeMeetingHubEventTimestamps(page: number) {
    const eventTimestamps = [];
    let current = new Date();

    // Adjust current date based on page number
    current = new Date(current.setDate(current.getDate() + (7 * page - 7)));
    let year = current.getFullYear();
    let month = current.getMonth() + 1;
    const today = current.getDate();
    const monthDays = new Date(year, month, 0).getDate();

    // Generate timestamp ranges for the next 12 days
    for (let day = today; day <= today + 12; day++) {
      if (day > monthDays) {
        // Handle month rollover
        if (month === 12) {
          day = 1;
          month = 1;
          year += 1;
        } else {
          day = 1;
          month += 1;
        }
      }

      current = new Date(year + '-' + month + '-' + day);
      eventTimestamps.push({
        startDate: new Date(current.setHours(0, 0, 0, 0)), // Start of the day
        endDate: new Date(current.setHours(23, 59, 59, 0)), // End of the day
      });

      // Limit the number of timestamps to 8
      if (eventTimestamps.length >= 8) break;
    }

    return eventTimestamps; // Return the generated timestamps
  }

  // Compute timestamps based on user-defined date range
  computeTimestampsFromUserDateRange(userDateRange: DateRangeInterface) {
    const timestamps = [];
    const startDate = new Date(userDateRange.startDate);
    const endDate = new Date(userDateRange.endDate);

    // Loop through each date in the range and add to timestamps
    for (let dt = startDate; dt <= endDate; ) {
      timestamps.push({
        startDate: new Date(dt.setHours(0, 0, 0)), // Start of day
        endDate: new Date(dt.setHours(23, 59, 59)), // End of day
      });
      dt.setDate(dt.getDate() + 1); // Move to the next day
    }

    // Ensure end date is added if it doesn't match the full range
    if (
      timestamps.length &&
      timestamps[timestamps.length - 1]?.startDate.getTime() !==
        startDate.getTime() &&
      timestamps[timestamps.length - 1]?.endDate.getTime() !== endDate.getTime()
    ) {
      timestamps.push({
        startDate: new Date(endDate.setHours(0, 0, 0)), // Start of the final day
        endDate: new Date(endDate.setHours(23, 59, 59)), // End of the final day
      });
    }

    // Adjust the first and last timestamps to match user's hour/min/sec
    if (timestamps.length > 0) {
      timestamps[0].startDate.setHours(
        userDateRange.startDate.getHours(),
        userDateRange.startDate.getMinutes(),
        userDateRange.startDate.getSeconds(),
      );
      timestamps[timestamps.length - 1].endDate.setHours(
        userDateRange.endDate.getHours(),
        userDateRange.endDate.getMinutes(),
        userDateRange.endDate.getSeconds(),
      );
    }

    return timestamps; // Return the computed timestamps
  }

  // Retrieve an event by its ID and handle errors
  private async getEventById(eventId: string, header: HeaderUser) {
    console.log('EVENT ID---------------', eventId);
    try {
      const event = await this.eventServices.findOne(eventId);
      // Throw error if event is not found
      if (!event)
        throw new ConflictException(
          translate(`Event Not found`, header.language),
        );
      return event; // Return the found event
    } catch (err) {
      throw new ConflictException(err); // Handle errors
    }
  }

  // Validate the meeting time slots against the event's timestamps
  async validateEventMeetingTimeslots(
    eventId: string,
    startTime: Date,
    endTime: Date,
    header: HeaderUser,
    pastMeeting?: boolean,
  ) {
    try {
      // Fetch the event's timestamps to validate against
      const eventTimeslots = await this.getEventTimestamps(eventId, header);
      // Validate the provided start and end times against the fetched timestamps
      return this.validateTimestamps(
        eventTimeslots,
        startTime,
        endTime,
        header,
        pastMeeting,
      );
    } catch (err) {
      console.log('ERROR--------------', err); // Log the error for debugging
      // Return a failure response with the error message
      return { status: false, message: err.message || 'Unknown error' };
    }
  }
}
