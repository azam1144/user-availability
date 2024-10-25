import { Body, Controller, Post, Query, Headers } from '@nestjs/common';
import { GetEventId, GetUser, HeaderUser } from '@aldb2b/common';
import { GetCalenderDto } from '../dto/get-calender.dto';
import { CalendarService } from '../services/calendar.service';

@Controller('calendar')
export class AvailabilityCalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  // Get Other users availability, intersecting them with each other
  @Post('get-available-slots')
  getAvailability(
    @Query() query,
    @Headers() header,
    @GetUser() user: HeaderUser,
    @GetEventId() eventId: string,
    @Body() getCalenderDto: GetCalenderDto,
  ): Promise<any> {
    getCalenderDto.eventId = eventId;
    getCalenderDto.page = query?.page ? query.page : 1;

    getCalenderDto.meetingHubEvent = user.meetingHubEvent
      ? user.meetingHubEvent
      : false;

    return this.calendarService.getAvailability(getCalenderDto, user, true);
  }

  // Get my availability, intersecting my un-availabilities with other's ( Guest or host ) un-availabilities
  @Post('get-my-available-slots')
  getMyAvailability(
    @Query() query,
    @Headers() header,
    @GetUser() user: HeaderUser,
    @GetEventId() eventId: string,
    @Body() getCalenderDto: GetCalenderDto,
  ): Promise<any> {
    getCalenderDto.eventId = eventId;
    getCalenderDto.page = query?.page ? query.page : 1;
    if (!getCalenderDto.contactId) {
      getCalenderDto.contactId = user.contactId;
    }
    getCalenderDto.meetingHubEvent = user.meetingHubEvent
      ? user.meetingHubEvent
      : false;

    return this.calendarService.getAvailability(getCalenderDto, user, true);
  }
}
