export enum StatusEnum {
  SUCCESS = 'success',
  FAIL = 'fail',
  ERROR = 'error',
}

export enum OriginWeb {
  AZO = 'azo',
  DG1 = '1dg',
  YTAPI = 'ytapi',
}

export enum Action {
  services = 'services',
  status = 'status',
  order = 'order',
  add = 'add',
}

export enum StatusService {
  Pending = 'Pending',
  Processing = 'Processing',
  'In Progress' = 'In Progress',
  Completed = 'Completed',
  Partial = 'Partial',
  Canceled = 'Canceled',
}
export interface ResponeService {
  service: number;
  name: string;
  category: string;
  platform?: string;
  rate: number;
  min: number;
  max: number;
  type: string;
  refill: boolean;
}

export interface ResponseInforService {
  charge: number;
  start_count: number;
  status: string;
  remains: number;
  error?: string;
}

export enum Status {
  'Pending' = 'Chờ duyệt',
  'Processing' = 'Đang kiểm tra',
  'In Progress' = 'Đang tiến hành',
  'Completed' = 'Hoàn thành',
  'Partial' = 'Đã chạy một phần',
  'Canceled' = 'Bị hủy',
}

export enum Role {
  'admin' = 'admin',
  'user' = 'user',
  'other' = 'other',
}

export enum MethodPay {
  HANDLE = 'handle',
  BANK = 'bank',
}

export enum TypeHistory {
  addMoney = "addMoney",
  order = "order"
}

export enum StatusInvoice {
  processing = "processing",
  completed = "completed",
  cancelled = "cancelled"
}

export enum PayPalEventType {
  PAYMENT_CAPTURE_COMPLETED = 'PAYMENT.CAPTURE.COMPLETED',
  PAYMENT_CAPTURE_DECLINED = 'CHECKOUT.ORDER.DECLINED',
  PAYMENT_CAPTURE_REFUNDED = 'PAYMENT.CAPTURE.REFUNDED',
  PAYMENT_CAPTURE_DENIED = 'PAYMENT.CAPTURE.DENIED',
}

export enum ChannelInvoice{
  BANKING = "banking",
  FPAYMENT = "fpayment"
}