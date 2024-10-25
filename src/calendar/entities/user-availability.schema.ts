import {
  regExpTime,
  MeetingType,
  validateNewItem,
  validateProjection,
  validateUpdateItem,
  validateProjectionResult,
} from '@aldb2b/common';
import * as mongoose from 'mongoose';
import { Event } from '../../event/entities/event.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { UserAvailabilityDay } from '../enums/user-availability-day.enum';

const Document = mongoose.Document;
const ObjectId = mongoose.Schema.Types.ObjectId;

@Schema()
export class UserAvailabilityTimeSlot extends Document {
  @Prop({
    type: String,
    required: true,
    enum: Object.values(UserAvailabilityDay),
  })
  day: UserAvailabilityDay;

  @Prop({
    type: String,
    required: true,
    validate: regExpTime,
  })
  startTime: string;

  @Prop({ type: String, required: true, validate: regExpTime })
  endTime: string;
}

@Schema()
export class UserAvailability extends Document {
  @Prop({ type: ObjectId, index: true, ref: Event.name })
  eventId: string;

  @Prop({ type: ObjectId, required: true })
  contactId: string;

  @Prop({
    type: [Number],
    default: [],
    validate: {
      validator: (durations: number[]) => {
        if (durations && durations.length) {
          return durations.every((duration) => duration % 15 === 0);
        } else {
          return true;
        }
      },
      message: 'Duration must be a multiple of 15',
    },
  })
  durations: number[];

  @Prop({ type: String, trim: true, unique: true })
  link: string;

  @Prop({ type: Number, max: 1440, min: -1440, default: 0 })
  timeZone: number;

  @Prop({ type: String, trim: true })
  timeZoneName: string;

  @Prop([{ type: UserAvailabilityTimeSlot, default: [] }])
  userAvailabilityTimeSlots: UserAvailabilityTimeSlot[];

  @Prop({ type: Number })
  preMeetingReminder: number;

  @Prop({ type: Boolean, default: false })
  primary: boolean;

  @Prop({ type: String })
  location: string;

  @Prop({ type: Number, default: 0 })
  viewCount: number;

  @Prop({ type: Number, default: 0 })
  scheduledMeetingCount: number;

  @Prop({
    type: String,
    enum: Object.values(MeetingType),
    default: MeetingType.ZOOM,
  })
  meetingType: MeetingType;

  @Prop({ type: Date, required: true, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, required: true, default: Date.now })
  updatedAt: Date;
}

const allProjectionFieldArray = [
  '_id',
  'eventId',
  'contactId',
  'durations',
  'link',
  'timeZone',
  'timeZoneName',
  'userAvailabilityTimeSlots',
  'preMeetingReminder',
  'primary',
  'location',
  'meetingType',
  'viewCount',
  'scheduledMeetingCount',
  'createdAt',
  'updatedAt',
];

const allValidateNewItemFieldArray = [
  '_id',
  'eventId',
  'contactId',
  'durations',
  'link',
  'timeZone',
  'timeZoneName',
  'userAvailabilityTimeSlots',
  'preMeetingReminder',
  'createdAt',
  'primary',
  'location',
  'meetingType',
  'viewCount',
  'scheduledMeetingCount',
  'updatedAt',
];

const allValidateUpdateItemFieldArray = [
  'durations',
  'link',
  'timeZone',
  'timeZoneName',
  'userAvailabilityTimeSlots',
  'preMeetingReminder',
  'primary',
  'location',
  'meetingType',
  'viewCount',
  'scheduledMeetingCount',
  'updatedAt',
];

const InitialUserAvailabilitySchema =
  SchemaFactory.createForClass(UserAvailability);

InitialUserAvailabilitySchema.statics.validateProjectionResult = (
  necessaryProjectionObj,
) => validateProjectionResult(allProjectionFieldArray, necessaryProjectionObj);

InitialUserAvailabilitySchema.statics.validateProjection = (
  necessaryProjectionArray,
) => validateProjection(allProjectionFieldArray, necessaryProjectionArray);

InitialUserAvailabilitySchema.statics.validateNewItem = (newItemObj) =>
  validateNewItem(allValidateNewItemFieldArray, newItemObj);

InitialUserAvailabilitySchema.statics.validateUpdateItem = (updateItemObj) =>
  validateUpdateItem(allValidateUpdateItemFieldArray, updateItemObj);

InitialUserAvailabilitySchema.pre(
  'findOneAndUpdate',
  async function (this, next) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    this._update.updatedAt = new Date();
    next();
  },
);

InitialUserAvailabilitySchema.index({ eventId: 1 });
InitialUserAvailabilitySchema.index({ contactId: 1 });

export const UserAvailabilitySchema = InitialUserAvailabilitySchema;
