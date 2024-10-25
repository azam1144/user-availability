import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { UserAvailabilityRepository } from '../repositories/user-availability.repository';
import { GetCalenderDto } from '../dto/get-calender.dto';
import { CalendarService } from './calendar.service';
import { BaseCalendarInterface } from '../interfaces/base-calendar.interface';
import { intersectOptionAvailabilities } from './intersect-option-availabilities';
import { calculateTimeSlotsIntersection } from './calculate-time-slots-intersection';
import { updateBaseCalendarByTimeSlots } from './update-base-calendar-by-time-slots';

@Injectable()
export class UserAvailabilityService {
  constructor(
    @Inject(forwardRef(() => CalendarService))
    private userAvailabilityRepository: UserAvailabilityRepository,
  ) {}

  async intersectUserAvailabilities(
    baseCalendar: BaseCalendarInterface,
    getCalenderDto: GetCalenderDto,
    includeUnavailablities: boolean,
  ): Promise<BaseCalendarInterface> {
    // Check if there are available slots in the base calendar
    if (baseCalendar.available && baseCalendar.available.length) {
      const contactIds: string[] = []; // Array to hold contact IDs for fetching user availabilities

      // Collect guest IDs from the DTO
      if (getCalenderDto.guestIds && getCalenderDto.guestIds.length) {
        contactIds.push(...getCalenderDto.guestIds);
      }

      // Collect host IDs or a single contact ID from the DTO
      if (getCalenderDto.hostIds && getCalenderDto.hostIds.length) {
        contactIds.push(...getCalenderDto.hostIds);
      } else if (getCalenderDto.contactId) {
        contactIds.push(getCalenderDto.contactId);
      }

      // Fetch user availabilities based on the collected contact IDs
      const userAvailabilities =
        await this.userAvailabilityRepository.getUserAvailabilityByContactIds(
          getCalenderDto.link
            ? { link: getCalenderDto.link }
            : {
                contactId: { $in: contactIds },
                primary: true,
                eventId: getCalenderDto.eventId,
              },
        );

      // If user availabilities are found, process them
      if (userAvailabilities && userAvailabilities.length) {
        // Intersect the retrieved user availabilities
        const finalUserAvailabilities =
          intersectOptionAvailabilities(userAvailabilities);

        // Calculate the intersection of time slots from the final user availabilities
        const intersectedUserAvailabilities = calculateTimeSlotsIntersection(
          finalUserAvailabilities,
        );

        // Update the base calendar with the intersected user availabilities
        baseCalendar = updateBaseCalendarByTimeSlots(
          baseCalendar,
          intersectedUserAvailabilities,
          includeUnavailablities,
          true,
          getCalenderDto.duration,
        );
      }
    }

    // Return the updated base calendar
    return baseCalendar;
  }
}
