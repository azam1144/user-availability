import * as Moment from 'moment';
import { Subjects } from '@aldb2b/common';
import { Injectable } from '@nestjs/common';
import { extendMoment } from 'moment-range';
import { CalendarBase } from './calendar-base.service';
import { GroupMessageBroker } from '../rpcs/group-message-broker';
import { BaseCalendarInterface } from '../interfaces/base-calendar.interface';
import { DateRangeInterface } from '../interfaces/date-range.interface';
const momentRange = extendMoment(Moment);

@Injectable()
export class GroupIntersect extends CalendarBase {
  constructor(protected groupMessageBroker: GroupMessageBroker) {
    super(); // Call the constructor of the base class
  }

  async intersection(
    queryParams,
    baseCalendar: BaseCalendarInterface,
    eventTimestamps: DateRangeInterface[],
    startDate: string,
    endDate: string,
  ) {
    // Get Groups for Guest company if specified
    if (queryParams.guestCompanyId) {
      const guestGroups = await this.getGroupsByCompanyId(
        queryParams.guestCompanyId,
        queryParams.eventId,
        startDate,
        endDate,
      );
      if (guestGroups.length > 0)
        baseCalendar = this.groupsIntersection(baseCalendar, guestGroups); // Intersect guest groups with base calendar
    }

    // Get Groups for Host company if specified
    if (queryParams.hostCompanyId) {
      const hostGroups = await this.getGroupsByCompanyId(
        queryParams.hostCompanyId,
        queryParams.eventId,
        startDate,
        endDate,
      );
      if (hostGroups.length > 0)
        baseCalendar = this.groupsIntersection(baseCalendar, hostGroups); // Intersect host groups with base calendar
    }

    return baseCalendar; // Return the updated base calendar
  }

  private groupsIntersection(
    baseCalendar: BaseCalendarInterface,
    groups: DateRangeInterface[],
  ) {
    // Iterate over the groups and update base calendar for each group
    for (const group of groups) {
      if (group)
        baseCalendar = this.intersectWithBaseCalendar(baseCalendar, group); // Compute intersection with each group
    }
    return baseCalendar; // Return the updated base calendar
  }

  intersectWithBaseCalendar(
    baseCalendar: BaseCalendarInterface,
    group: DateRangeInterface,
  ) {
    console.log('intersectWithBaseCalendar: ');
    const availability = baseCalendar.available; // Get available time slots from base calendar
    baseCalendar.available = []; // Clear existing available slots for recalculation
    // Check each available time slot for overlap with the group's dates
    for (const bCalendar of availability) {
      const gStartDate = momentRange.utc(group.startDate); // Convert group start date to UTC
      const gEndDate = momentRange.utc(group.endDate); // Convert group end date to UTC
      const bStartDate = momentRange.utc(bCalendar.startDate); // Convert base calendar start date to UTC
      const bEndDate = momentRange.utc(bCalendar.endDate); // Convert base calendar end date to UTC

      const gRange = momentRange.range(gStartDate, gEndDate); // Create a range for the group dates
      const bRange = momentRange.range(bStartDate, bEndDate); // Create a range for the base calendar dates

      const isOverlap = bRange.overlaps(gRange); // Check if the two ranges overlap
      let subtract; // Variable to hold the resulting range after subtracting overlaps
      console.log('isOverlap: ', isOverlap);
      if (isOverlap) {
        // Handle overlapping ranges
        if (gStartDate <= bStartDate && gEndDate >= bEndDate)
          subtract = gRange.subtract(bRange); // Group fully covers base calendar
        else subtract = bRange.subtract(gRange); // Base calendar partially covers group

        console.log('subtract: ', subtract);
        if (subtract.length === 2) {
          // If two ranges remain after subtraction
          const subPart = subtract[0]; // First part of the remaining range
          const subNextPart = subtract[1]; // Second part of the remaining range

          if (gStartDate <= bStartDate && gEndDate >= bEndDate) {
            // If group fully covers the base calendar
            baseCalendar.unavailable.push({
              startDate: bStartDate,
              endDate: bEndDate,
            });
          } else {
            // If there are gaps in availability
            baseCalendar.available.push({
              startDate: subPart.start.toDate(),
              endDate: subPart.end.toDate(),
            });

            baseCalendar.available.push({
              startDate: subNextPart.start.toDate(),
              endDate: subNextPart.end.toDate(),
            });

            baseCalendar.unavailable.push({
              startDate: subPart.end.toDate(),
              endDate: subNextPart.start.toDate(),
            });
          }
        } else if (subtract.length === 1) {
          // If one range remains after subtraction
          if (gStartDate <= bStartDate && gEndDate >= bEndDate) {
            // Group fully covers base calendar
            console.log('1');
            baseCalendar.unavailable.push({
              startDate: bStartDate,
              endDate: bEndDate,
            });
          } else if (gStartDate <= bStartDate) {
            // Group starts before the base calendar
            console.log('2');
            baseCalendar.unavailable.push({
              startDate: bStartDate,
              endDate: gEndDate,
            });

            baseCalendar.available.push({
              startDate: gEndDate,
              endDate: bEndDate,
            });
          } else if (gEndDate >= bEndDate) {
            // Group ends after the base calendar
            console.log('3');
            baseCalendar.unavailable.push({
              startDate: gStartDate,
              endDate: bEndDate,
            });

            baseCalendar.available.push({
              startDate: bStartDate,
              endDate: gStartDate,
            });
          }
        } else if (subtract.length === 0) {
          // If no ranges are left, mark the whole base calendar as unavailable
          baseCalendar.unavailable.push({
            startDate: bStartDate,
            endDate: bEndDate,
          });
        }
      } else {
        // If no overlap, keep the base calendar available
        baseCalendar.available.push({
          startDate: bStartDate,
          endDate: bEndDate,
        });
      }
    }
    // Sort available and unavailable time slots
    baseCalendar.available.sort((a, b) => (a.startDate > b.endDate && 1) || -1);
    baseCalendar.unavailable.sort(
      (a, b) => (a.startDate > b.endDate && 1) || -1,
    );
    return baseCalendar; // Return the updated base calendar
  }

  private async getGroupsByCompanyId(
    companyId: string,
    eventId: string,
    startDate: string,
    endDate: string,
  ) {
    // Fetch group data from the message broker based on company ID and event details
    return this.groupMessageBroker.getGroupByCompanyId({
      subject: Subjects.GroupsByCompany,
      data: {
        companyId,
        eventId,
        startDate,
        endDate,
      },
    });
  }
}
