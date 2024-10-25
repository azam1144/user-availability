import { firstValueFrom } from 'rxjs';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { GetContactsByQueryEvent, MeetingRequestedUsers } from '@aldb2b/common';

@Injectable()
export class ContactsMessageBrokerService {
  constructor(
    @Inject('Contacts_Message_Broker_Service')
    private readonly client: ClientProxy,
  ) {}

  getContacts(contacts: MeetingRequestedUsers.Context): any {
    console.log('SUBJECT-----------', contacts.subject);
    console.log('IDS---------------', contacts.data);
    return firstValueFrom(this.client.send(contacts.subject, contacts.data));
  }

  getContactsByQuery(contacts: GetContactsByQueryEvent.Context): any {
    console.log('SUBJECT-----------', contacts.subject);
    console.log('IDS---------------', contacts.data);
    return firstValueFrom(this.client.send(contacts.subject, contacts.data));
  }
}
