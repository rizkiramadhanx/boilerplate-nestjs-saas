import { Injectable } from '@nestjs/common';
import { createSuccessResponse } from './common/type/response';

@Injectable()
export class AppService {
  getHello() {
    return createSuccessResponse('Hello World Ojok', {
      message: 'Hello World Ojok',
    });
  }
}
