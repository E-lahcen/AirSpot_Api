import {
  Injectable,
  NestMiddleware,
  RequestTimeoutException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class TimeoutMiddleware implements NestMiddleware {
  // 60 seconds timeout for all requests
  private readonly timeout = 60000;

  use(req: Request, res: Response, next: NextFunction) {
    const timeoutId = setTimeout(() => {
      if (!res.headersSent) {
        throw new RequestTimeoutException(
          'Request timeout - operation took too long to complete',
        );
      }
    }, this.timeout);

    // Clear timeout when response finishes
    res.on('finish', () => {
      clearTimeout(timeoutId);
    });

    res.on('close', () => {
      clearTimeout(timeoutId);
    });

    next();
  }
}
