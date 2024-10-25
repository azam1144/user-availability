import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CustomModel, MongooseBase } from '@aldb2b/common';
import { UserAvailability } from '../entities/user-availability.schema';
import { CreateUserAvailabilityDto } from '../dto/create-user-availability.dto';
import { UpdateUserAvailabilityDto } from '../dto/update-user-availability.dto';

@Injectable()
export class UserAvailabilityRepository extends MongooseBase<UserAvailability> {
  constructor(
    @InjectModel(UserAvailability.name)
    private userAvailabilityModel: CustomModel<UserAvailability>,
  ) {
    super(userAvailabilityModel);
  }

  async getUserAvailabilityByContactIds(
    query: any,
  ): Promise<UserAvailability[]> {
    const { data: userAvailabilities } = await this.read({
      query,
      lean: true,
    });
    return userAvailabilities;
  }

  async updateById(
    id: string,
    userAvailabilityDto: UpdateUserAvailabilityDto,
  ): Promise<UserAvailability> {
    return this.findOneAndUpdate({
      query: { _id: id },
      data: userAvailabilityDto,
    });
  }

  async createOne(
    contactId: string,
    userAvailabilityDto: CreateUserAvailabilityDto,
    eventId?: string,
  ): Promise<UserAvailability> {
    return this.create({
      ...userAvailabilityDto,
      contactId: contactId,
      eventId: eventId,
    });
  }

  async checkLinkDuplication(
    link: string,
    userAvailabilityId?: string,
  ): Promise<boolean> {
    const theQuery: any = { link: link };
    if (userAvailabilityId) {
      theQuery._id = { $ne: userAvailabilityId };
    }
    const userAvailabilityCount = await this.count(theQuery);
    return userAvailabilityCount > 0;
  }

  async getAllSimilarLinks(links: string[]): Promise<string[]> {
    const theQuery = {
      $or: links.map((item) => {
        return { link: { $regex: item, $options: 'i' } };
      }),
    };
    const response = await this.read({
      query: theQuery,
      lean: true,
      necessaryProjectionArray: ['link'],
    });
    return response.data.map((item) => item.link);
  }

  async getBySort(query: any, sort: any): Promise<UserAvailability[]> {
    return this.userAvailabilityModel.find(query).sort(sort).limit(1);
  }
}
