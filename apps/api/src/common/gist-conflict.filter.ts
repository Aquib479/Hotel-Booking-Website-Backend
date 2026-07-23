import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { Response } from 'express';

@Catch(QueryFailedError)
export class GistConflictFilter implements ExceptionFilter {
  catch(exception: QueryFailedError & { code?: string; detail?: string }, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    if (exception.code === '23P01') {
      const isHoldConflict = exception.detail?.includes('idx_one_hold_per_guest');
      res.status(HttpStatus.CONFLICT).json({
        statusCode: HttpStatus.CONFLICT,
        code: isHoldConflict ? 'EXISTING_HOLD' : 'SLOT_UNAVAILABLE',
        message: isHoldConflict
          ? 'You already have an active hold. Complete or release it first.'
          : 'This slot is no longer available.',
      });
      return;
    }

    throw exception;
  }
}
