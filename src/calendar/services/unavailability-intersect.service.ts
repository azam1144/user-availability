import * as Moment from 'moment';
import { extendMoment } from 'moment-range';
import { Injectable } from '@nestjs/common';
import { DateRangeInterface } from '../interfaces/date-range.interface';
import { CalendarType } from '../enums/calendar-type.enum';
import { BaseCalendarInterface } from '../interfaces/base-calendar.interface';
import { UnavailableService } from 'src/unavailable/services/unavailable.service';
import { GetCalenderDto } from '../dto/get-calender.dto';
const momentRange = extendMoment(Moment);

@Injectable()
export class UnavailabilityIntersect {
  constructor(protected unavailableService: UnavailableService) {}

  async availabilityIntersection(
    queryParams: GetCalenderDto,
    baseCalendar: BaseCalendarInterface,
    startDate: string,
    endDate: string,
  ) {
    // Initialize an empty list to store host and guest IDs
    let availabilityUsersList = [];

    // If host IDs are provided, add them to the availability user list
    if (Array.isArray(queryParams.hostIds) && queryParams.hostIds.length > 0)
      availabilityUsersList = availabilityUsersList.concat(queryParams.hostIds);

    // If guest IDs are provided, add them to the availability user list
    if (Array.isArray(queryParams.guestIds) && queryParams.guestIds.length > 0)
      availabilityUsersList = availabilityUsersList.concat(
        queryParams.guestIds,
      );

    // Check if there are any users to retrieve availability for
    if (availabilityUsersList.length > 0) {
      // Fetch the availability of the listed users for the provided event and date range
      const userAvailabilities = await this.getAvailabilityByUserIds(
        availabilityUsersList,
        queryParams.eventId,
        startDate,
        endDate,
      );

      // If users are unavailable and the base calendar has available slots
      if (
        !userAvailabilities.status &&
        userAvailabilities.unavailable.length > 0 &&
        baseCalendar.available.length > 0
      ) {
        // Get the union of all unavailable times
        const availabilities = this.getAvailabilityUnion(
          userAvailabilities.unavailable,
        );

        // If there are any availabilities found
        if (availabilities.length > 0)
          // Intersect the base calendar with the found unavailability slots
          baseCalendar = this.intersectWithUserAvailability(
            baseCalendar,
            availabilities,
          );
      }
    }

    // Return the modified base calendar with updated availability
    return baseCalendar;
  }

  async intersection(
    queryParams: GetCalenderDto,
    baseCalendar: BaseCalendarInterface,
    startDate: string,
    endDate: string,
    includeUnavailablities: boolean,
  ) {
    // Initialize an empty array to store contact IDs for intersection
    let contactIds = [];

    // Add the logged-in user's contact ID if the meeting is not hosted in a meeting hub
    if (!queryParams.meetingHubEvent && queryParams.contactId) {
      contactIds.push(queryParams.contactId);
    }

    // Add host IDs to the contact IDs list if they exist
    if (queryParams.hostIds && queryParams.hostIds.length) {
      contactIds.push(...queryParams.hostIds);
    }

    // Add guest IDs to the contact IDs list if they exist
    // Note: Only add guest IDs if they are explicitly provided
    if (queryParams.guestIds && queryParams.guestIds.length) {
      contactIds.push(...queryParams.guestIds);
    }

    // Remove duplicates and filter out any falsy values from the contactIds array
    contactIds = [...new Set(contactIds.filter((contactId) => contactId))];

    // Fetch the unavailability slots for the specified contact IDs within the given date range
    const unavailabilities = await this.getUnavailabilityByUserIds(
      contactIds,
      queryParams.eventId,
      startDate,
      endDate,
    );

    // If there are unavailability slots and the base calendar has available slots
    if (
      !unavailabilities.status &&
      unavailabilities.unavailable.length > 0 &&
      baseCalendar.available.length > 0
    ) {
      // Intersect the base calendar with the retrieved unavailability slots
      baseCalendar = this.intersectWithUserUnAvailability(
        baseCalendar,
        unavailabilities.unavailable,
      );
    }

    // Return the modified base calendar with updated availability
    return baseCalendar;
  }

  private getAvailabilityUnion(userUnAvailabilities: DateRangeInterface[]) {
    // Initialize an empty array to hold the unified availability ranges
    const availabilities = [];

    // Iterate through each user's unavailable time range
    for (const outerAvailability of userUnAvailabilities) {
      let overlapStatus = false; // Flag to track if there is any overlap

      // Check for overlaps with already processed availabilities
      for (const innerAvailability of availabilities) {
        // Parse the start and end dates using momentRange for both ranges
        const oStartDate = momentRange.utc(outerAvailability.startDate);
        const oEndDate = momentRange.utc(outerAvailability.endDate);
        const iStartDate = momentRange.utc(innerAvailability.startDate);
        const iEndDate = momentRange.utc(innerAvailability.endDate);
        const oRange = momentRange.range(oStartDate, oEndDate); // Create a range for the outer availability
        const iRange = momentRange.range(iStartDate, iEndDate); // Create a range for the inner availability

        // Check if the two ranges overlap
        const isOverlap = oRange.overlaps(iRange);
        if (isOverlap) {
          overlapStatus = true; // Mark as overlapping
          let startDate;
          let endDate;

          // Determine the start date of the new merged range
          if (oStartDate < iStartDate) startDate = oStartDate;
          else startDate = iStartDate;

          // Determine the end date of the new merged range
          if (oEndDate < iEndDate) endDate = iEndDate;
          else endDate = oEndDate;

          // Update the inner availability with the new merged dates
          innerAvailability.startDate = startDate;
          innerAvailability.endDate = endDate;
        }
      }

      // If there was no overlap, add the outer availability as a new availability
      if (!overlapStatus) {
        availabilities.push({
          startDate: outerAvailability.startDate,
          endDate: outerAvailability.endDate,
        });
      }
    }

    // Return the consolidated list of availability ranges
    return availabilities;
  }

  private intersectWithUserAvailability(
    baseCalendar: BaseCalendarInterface,
    userAvailabilities: DateRangeInterface[],
  ) {
    // Iterate through each user's availability range
    for (const availabilities of userAvailabilities) {
      // Intersect the base calendar with the current user's availability
      baseCalendar = this.availabilityIntersects(baseCalendar, availabilities);
    }

    // Return the updated base calendar after all intersections
    return baseCalendar;
  }

  private intersectWithUserUnAvailability(
    baseCalendar: BaseCalendarInterface,
    userUnAvailabilities: DateRangeInterface[],
  ) {
    // Loop through each user's unavailability record
    for (const unAvailability of userUnAvailabilities) {
      // Update the base calendar by intersecting it with the current user's unavailability
      baseCalendar = this.unavailabilityIntersects(
        baseCalendar,
        unAvailability,
      );
    }

    // Return the adjusted base calendar after processing all unavailability records
    return baseCalendar;
  }

  private availabilityIntersects(
    baseCalendar: BaseCalendarInterface,
    userUnavailability: DateRangeInterface,
  ) {
    // Initialize an empty array to store available time slots after intersection
    const available = [];

    // Iterate through each available time slot in the base calendar
    for (const bCalendar of baseCalendar.available) {
      let overlapStatus = false; // Flag to track if there's an overlap
      const uStartDate = momentRange.utc(userUnavailability.startDate);
      const uEndDate = momentRange.utc(userUnavailability.endDate);
      const bStartDate = momentRange.utc(bCalendar.startDate);
      const bEndDate = momentRange.utc(bCalendar.endDate);

      // Create date ranges for user unavailability and base calendar availability
      const uRange = momentRange.range(uStartDate, uEndDate);
      const bRange = momentRange.range(bStartDate, bEndDate);

      // Check if the two ranges overlap
      const isOverlap = bRange.overlaps(uRange);
      if (isOverlap) {
        overlapStatus = true; // Mark as overlapping
        let subtract;

        // Determine which range to subtract
        if (uStartDate <= bStartDate && uEndDate >= bEndDate) {
          subtract = uRange.subtract(bRange);
        } else {
          subtract = bRange.subtract(uRange);
        }

        // Handle the case with two resultant parts after subtraction
        if (subtract.length === 2) {
          const subPart = subtract[0]; // First part of the split range
          const subNextPart = subtract[1]; // Second part of the split range

          // If the user unavailability fully encompasses the base availability
          if (uStartDate <= bStartDate && uEndDate >= bEndDate) {
            available.push({
              startDate: bStartDate,
              endDate: bEndDate,
            });
          } else {
            // Otherwise, push both parts of the split range
            available.push({
              startDate: subPart.start.toDate(),
              endDate: subPart.end.toDate(),
            });
            available.push({
              startDate: subNextPart.start.toDate(),
              endDate: subNextPart.end.toDate(),
            });
            // Add the user's unavailability to the calendar
            baseCalendar.unavailable.push({
              startDate: uStartDate,
              endDate: uEndDate,
            });
          }
        }
        // Handle the case with one resultant part after subtraction
        else if (subtract.length === 1) {
          if (uStartDate <= bStartDate && uEndDate >= bEndDate) {
            baseCalendar.unavailable.push({
              startDate: bStartDate,
              endDate: bEndDate,
            });
          } else if (uStartDate <= bStartDate) {
            // If the unavailability starts before base availability
            available.push({
              startDate: uEndDate,
              endDate: bEndDate,
            });
            baseCalendar.unavailable.push({
              startDate: bStartDate.toDate(),
              endDate: uEndDate,
            });
          } else if (uEndDate >= bEndDate) {
            // If the unavailability ends after base availability
            available.push({
              startDate: bStartDate.toDate(),
              endDate: uStartDate,
            });
            baseCalendar.unavailable.push({
              startDate: uStartDate,
              endDate: bEndDate,
            });
          }
        }
        // If there's no remainder after subtraction
        else if (subtract.length === 0) {
          // Push the entire unavailable range to unavailable
          baseCalendar.unavailable.push({
            startDate: bStartDate,
            endDate: bEndDate,
          });
        }
      }

      // If there was no overlap, add the original availability to the available list
      if (!overlapStatus) {
        available.push({
          startDate: momentRange.utc(bCalendar.startDate),
          endDate: momentRange.utc(bCalendar.endDate),
        });
      }
    }

    // Sort the available and unavailable lists in the base calendar
    if (available.length > 0) {
      baseCalendar.available = available.sort((a, b) =>
        a.startDate > b.endDate ? 1 : -1,
      );
      baseCalendar.unavailable.sort((a, b) =>
        a.startDate > b.endDate ? 1 : -1,
      );
    }

    // Return the updated base calendar
    return baseCalendar;
  }

  private unavailabilityIntersects(
    baseCalendar: BaseCalendarInterface,
    userUnavailability: DateRangeInterface,
  ) {
    // Initialize an empty array to store available time slots after intersection
    const available = [];

    // Iterate through each available time slot in the base calendar
    for (const bCalendar of baseCalendar.available) {
      let overlapStatus = false; // Flag to track if there's an overlap
      const uStartDate = momentRange.utc(userUnavailability.startDate);
      const uEndDate = momentRange.utc(userUnavailability.endDate);
      const bStartDate = momentRange.utc(bCalendar.startDate);
      const bEndDate = momentRange.utc(bCalendar.endDate);

      // Create date ranges for user unavailability and base calendar availability
      const uRange = momentRange.range(uStartDate, uEndDate);
      const bRange = momentRange.range(bStartDate, bEndDate);

      // Check if the two ranges overlap
      const isOverlap = bRange.overlaps(uRange);
      if (isOverlap) {
        overlapStatus = true; // Mark as overlapping
        let subtract;

        // Determine which range to subtract
        if (uStartDate <= bStartDate && uEndDate >= bEndDate) {
          subtract = uRange.subtract(bRange); // User's range fully encompasses the base
        } else {
          subtract = bRange.subtract(uRange); // Base range is within user's range
        }

        // Handle the case with two resultant parts after subtraction
        if (subtract.length === 2) {
          const subPart = subtract[0]; // First part of the split range
          const subNextPart = subtract[1]; // Second part of the split range

          // If the user's unavailability fully encompasses the base availability
          if (uStartDate <= bStartDate && uEndDate >= bEndDate) {
            baseCalendar.unavailable.push({
              startDate: bStartDate,
              endDate: bEndDate,
            });
          } else {
            // Otherwise, push both parts of the split range to available
            available.push({
              startDate: subPart.start.toDate(),
              endDate: subPart.end.toDate(),
            });
            available.push({
              startDate: subNextPart.start.toDate(),
              endDate: subNextPart.end.toDate(),
            });
            // Add the user's unavailability to the calendar
            baseCalendar.unavailable.push({
              startDate: uStartDate,
              endDate: uEndDate,
            });
          }
        }
        // Handle the case with one resultant part after subtraction
        else if (subtract.length === 1) {
          if (uStartDate <= bStartDate && uEndDate >= bEndDate) {
            // User unavailability covers the whole base availability
            baseCalendar.unavailable.push({
              startDate: bStartDate,
              endDate: bEndDate,
            });
          } else if (uStartDate <= bStartDate) {
            // User's unavailability starts before base availability
            available.push({
              startDate: uEndDate,
              endDate: bEndDate,
            });
            baseCalendar.unavailable.push({
              startDate: bStartDate.toDate(),
              endDate: uEndDate,
            });
          } else if (uEndDate >= bEndDate) {
            // User's unavailability ends after base availability
            available.push({
              startDate: bStartDate.toDate(),
              endDate: uStartDate,
            });
            baseCalendar.unavailable.push({
              startDate: uStartDate,
              endDate: bEndDate,
            });
          }
        }
        // If there's no remainder after subtraction
        else if (subtract.length === 0) {
          // Push the entire unavailable range to unavailable
          baseCalendar.unavailable.push({
            startDate: bStartDate,
            endDate: bEndDate,
          });
        }
      }

      // If there was no overlap, add the original availability to the available list
      if (!overlapStatus) {
        available.push({
          startDate: momentRange.utc(bCalendar.startDate),
          endDate: momentRange.utc(bCalendar.endDate),
        });
      }
    }

    // Sort the available and unavailable lists in the base calendar
    if (available.length > 0) {
      baseCalendar.available = available.sort(
        (a, b) => (a.startDate > b.endDate ? 1 : -1), // Sort available
      );
      baseCalendar.unavailable.sort(
        (a, b) => (a.startDate > b.endDate ? 1 : -1), // Sort unavailable
      );
    }

    // Return the updated base calendar
    return baseCalendar;
  }

  private async getUnavailabilityByUserIds(
    userIds: string[],
    eventId: string,
    startDate: string,
    endDate: string,
  ) {
    // Construct the query to find unavailable times for specified users within a date range
    const query = {
      eventId,
      userId: { $in: userIds },
      calendarType: CalendarType.UNAVAILABLE || undefined || null,
      $or: [
        {
          // Check for any entries that start within the specified range
          startDate: {
            $gte: new Date(startDate),
            $lt: new Date(endDate),
          },
        },
        {
          // Check for any entries that end within the specified range
          endDate: {
            $gt: new Date(startDate),
            $lte: new Date(endDate),
          },
        },
      ],
    };

    // Retrieve the unavailable records based on the query and return the result
    return this.unavailableService.findOneByDateRange(query);
  }

  private async getAvailabilityByUserIds(
    userIds: string[],
    eventId: string,
    startDate: string,
    endDate: string,
  ) {
    // Construct the query to find available times for specified users within a date range
    const query = {
      eventId,
      userId: { $in: userIds },
      calendarType: CalendarType.AVAILABLE,
      startDate: { $gte: new Date(startDate) },
      endDate: { $lte: new Date(endDate) },
    };

    // Retrieve the available records based on the query and return the result
    return this.unavailableService.findOneByDateRange(query);
  }
}
