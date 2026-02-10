
export interface queueEvnents {
  type: string;
  queueName: string;
  step: string;
  error?: any;
  data?: any;
  EventType?: string;
}




export interface queueModel {
  queueName: string;
  error?: any;
  report?: any;
}