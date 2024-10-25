export interface AvailabilityDateRangeInterface {
  startDate: any;
  endDate: any;
  durations?: number[];
  tableAvailableSlots?: TableAvailableSlotInterface[];
}

export interface TableAvailableSlotInterface {
  tables?: AvailableTableInterface[];
  startDate: Date;
  endDate: Date;
}

export interface AvailableTableInterface {
  id: string;
  buffer: number;
}
