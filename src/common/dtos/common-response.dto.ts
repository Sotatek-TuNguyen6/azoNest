import { StatusEnum } from 'src/types/enum';

export class CommonResponse<T> {
  success: StatusEnum;
  message?: string;
  data?: T;
  error?: any;

  constructor(success: StatusEnum, message?: string, data?: T, error?: any) {
    this.success = success;
    if (message) {
      this.message = message;
    }
    if (data) {
      this.data = data;
    }
    if (error) {
      this.error = error;
    }
  }
}
