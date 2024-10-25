import { CalendarBase } from './calendar-base.service';
import { GetCalenderDto } from '../dto/get-calender.dto';
import { EventTimestampService } from './event-timestamp.service';
import { GroupIntersect } from './group-intersect.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { UnavailabilityIntersect } from './unavailability-intersect.service';
import { HeaderUser } from '@aldb2b/common';
import { TableService } from 'src/tableMangement/services/table.service';
import { changeBaseCalendarAvailableSlots } from './change-base-calendar-available-slots';
import { UserAvailabilityService } from './user-availability.services';

@Injectable()
export class CalendarService {
  constructor(
    protected calendarBase: CalendarBase,
    protected eventTimestamp: EventTimestampService,
    protected groupIntersect: GroupIntersect,
    protected unavailabilityIntersect: UnavailabilityIntersect,
    protected tableService: TableService,
    protected userAvailabilityService: UserAvailabilityService,
  ) {}

  // Main method to retrieve availability based on the request type
  async getAvailability(
    getCalenderDto,
    header,
    includeUnavailablities,
    includeTables = false,
  ) {
    // Determine if the request is for MeetingHub or EventHub
    if (header?.meetingHubEvent || getCalenderDto?.meetingHubEvent) {
      return await this.getAvailabilityMeetingHub(
        getCalenderDto,
        header,
        includeUnavailablities,
        includeTables,
      );
    } else {
      return await this.getAvailabilityEventHub(
        getCalenderDto,
        header,
        includeUnavailablities,
        includeTables,
      );
    }
  }

  // Method to get availability for EventHub
  async getAvailabilityEventHub(
    getCalenderDto,
    header,
    includeUnavailablities,
    includeTables = false,
  ) {
    let eventTimestamps;
    let baseCalendar;

    // Fetch event timestamps based on the provided event ID
    if (getCalenderDto.eventId) {
      eventTimestamps = await this.eventTimestamp.getEventTimestamps(
        getCalenderDto.eventId,
        header,
      );
    } else {
      // Throw an error if event ID is missing
      throw new NotFoundException(
        `Event id (event-id) is must, please provide.`,
      );
    }

    // Compute the date range and base calendar from event timestamps
    const eventDateRange = this.calendarBase.getStartAndEndDate(
      eventTimestamps,
      header,
    );
    const startDate = eventDateRange.startDate;
    const endDate = eventDateRange.endDate;
    baseCalendar = this.calendarBase.computeBaseCalendar(
      startDate,
      endDate,
      eventTimestamps,
    );

    // Adjust user date range if provided and intersect with base calendar
    if (getCalenderDto.userStartDate && getCalenderDto.userEndDate) {
      let userDateRangeGroup = {
        startDate: getCalenderDto.userStartDate,
        endDate: getCalenderDto.userEndDate,
      };

      userDateRangeGroup = this.calendarBase.setStartAndEndDate(
        userDateRangeGroup,
        eventDateRange,
        header,
      );
      baseCalendar = this.groupIntersect.intersectWithBaseCalendar(
        baseCalendar,
        userDateRangeGroup,
      );
    }

    // Check if there are available slots in the base calendar
    if (baseCalendar.available && baseCalendar.available.length) {
      // Intersect host and guest groups with the base calendar
      if (getCalenderDto.hostCompanyId || getCalenderDto.guestCompanyId) {
        baseCalendar = await this.groupIntersect.intersection(
          getCalenderDto,
          baseCalendar,
          eventTimestamps,
          startDate,
          endDate,
        );
      }

      // Intersect unavailability for hosts and guests
      if (
        getCalenderDto.contactId ||
        (Array.isArray(getCalenderDto.hostIds) &&
          getCalenderDto.hostIds.length > 0) ||
        (Array.isArray(getCalenderDto.guestIds) &&
          getCalenderDto.guestIds.length > 0)
      ) {
        baseCalendar = await this.unavailabilityIntersect.intersection(
          getCalenderDto,
          baseCalendar,
          startDate,
          endDate,
          includeUnavailablities,
        );
      }
    }

    // Adjust available slots based on specific times and dates
    if (baseCalendar.available && baseCalendar.available.length) {
      baseCalendar = changeBaseCalendarAvailableSlots(
        baseCalendar,
        getCalenderDto.fromTime,
        getCalenderDto.toTime,
        getCalenderDto.speceficDates,
      );
    }

    // Intersect user availabilities with the base calendar
    if (baseCalendar.available && baseCalendar.available.length) {
      baseCalendar =
        await this.userAvailabilityService.intersectUserAvailabilities(
          baseCalendar,
          getCalenderDto,
          includeUnavailablities,
        );
    }

    // Fetch available tables for the specified hall ID if there are available slots
    if (
      getCalenderDto.hallId &&
      baseCalendar.available &&
      baseCalendar.available.length
    ) {
      baseCalendar.available =
        await this.tableService.getAvailableTablesForAvailableSlots(
          baseCalendar.available,
          getCalenderDto.hallId,
          includeTables,
          getCalenderDto.duration,
        );
    }

    return baseCalendar; // Return the final computed base calendar
  }

  // Method to get availability for MeetingHub
  async getAvailabilityMeetingHub(
    getCalenderDto: GetCalenderDto,
    header: HeaderUser,
    includeUnavailablities: boolean,
    includeTables: boolean = false,
  ) {
    let eventTimestamps;
    let baseCalendar;

    // Determine event timestamps based on user-provided dates or page number
    if (getCalenderDto.userStartDate && getCalenderDto.userEndDate) {
      const userDateRangeGroup = {
        startDate: new Date(getCalenderDto.userStartDate),
        endDate: new Date(getCalenderDto.userEndDate),
      };
      this.calendarBase.validateUserDateRange(userDateRangeGroup, header);

      eventTimestamps =
        this.eventTimestamp.computeTimestampsFromUserDateRange(
          userDateRangeGroup,
        );
    } else {
      eventTimestamps = this.eventTimestamp.computeMeetingHubEventTimestamps(
        getCalenderDto.page,
      );
    }

    // Compute the start and end dates from event timestamps
    const eventDateRange = this.calendarBase.getStartAndEndDate(
      eventTimestamps,
      header,
    );
    const startDate = eventDateRange.startDate;
    const endDate = eventDateRange.endDate;
    baseCalendar = this.calendarBase.computeBaseCalendar(
      startDate,
      endDate,
      eventTimestamps,
    );

    // If there are available slots in the base calendar
    if (baseCalendar.available && baseCalendar.available.length) {
      // Intersect host & guest availabilities with Base-calendar
      if (
        getCalenderDto.contactId ||
        (Array.isArray(getCalenderDto.hostIds) &&
          getCalenderDto.hostIds.length) ||
        (Array.isArray(getCalenderDto.guestIds) &&
          getCalenderDto.guestIds.length)
      ) {
        baseCalendar =
          await this.unavailabilityIntersect.availabilityIntersection(
            getCalenderDto,
            baseCalendar,
            startDate,
            endDate,
          );
      }

      // Intersect host & guest unavailability with Base-calendar
      if (
        getCalenderDto.contactId ||
        (Array.isArray(getCalenderDto.hostIds) &&
          getCalenderDto.hostIds.length > 0) ||
        (Array.isArray(getCalenderDto.guestIds) &&
          getCalenderDto.guestIds.length > 0)
      ) {
        baseCalendar = await this.unavailabilityIntersect.intersection(
          getCalenderDto,
          baseCalendar,
          startDate,
          endDate,
          includeUnavailablities,
        );
      }
    }

    // If there are still available slots in the base calendar
    if (baseCalendar.available && baseCalendar.available.length) {
      // Adjust available slots based on user-defined time ranges
      baseCalendar = changeBaseCalendarAvailableSlots(
        baseCalendar,
        getCalenderDto.fromTime,
        getCalenderDto.toTime,
        getCalenderDto.speceficDates,
      );
    }

    // Intersect user availabilities with the base calendar
    if (baseCalendar.available && baseCalendar.available.length) {
      baseCalendar =
        await this.userAvailabilityService.intersectUserAvailabilities(
          baseCalendar,
          getCalenderDto,
          includeUnavailablities,
        );
    }

    // If a hall ID is provided and there are available slots
    if (
      getCalenderDto.hallId &&
      baseCalendar.available &&
      baseCalendar.available.length
    ) {
      baseCalendar.available =
        await this.tableService.getAvailableTablesForAvailableSlots(
          baseCalendar.available,
          getCalenderDto.hallId,
          includeTables,
        );
    }

    // Return the final computed base calendar
    return baseCalendar;
  }
}
