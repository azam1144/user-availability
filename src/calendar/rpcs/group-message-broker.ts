import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { GroupsByCompany } from '@aldb2b/common';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class GroupMessageBroker {
  constructor(
    @Inject('GROUP_BY_COMPANY_ID_SERVICE') private client: ClientProxy,
  ) {}

  getGroupByCompanyId(group: GroupsByCompany.Context): any {
    console.log('GROUP_BY_COMPANY_ID_SERVICE-----------');
    console.log('SUBJECT-----------', group.subject);
    console.log('IDS---------------', group.data);
    return firstValueFrom(this.client.send(group.subject, group.data));
  }
}
