import { Injectable, NestMiddleware, HttpException, HttpStatus, Inject } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class GlobalRateLimiterMiddleware implements NestMiddleware {
    constructor(
        @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
    ) { }

    private readonly limit = 10; // 10 requests
    private readonly ttl = 1; // 60 seconds in seconds

    async use(req: any, res: any, next: () => void) {
        const key = 'global_request_count';

        const currentCount = await this.redisClient.incr(key);

        if (currentCount === 1) {
            // Set TTL only the first time the key is created
            await this.redisClient.expire(key, this.ttl);
        }

        if (currentCount > this.limit) {
            throw new HttpException(
                {
                    status: HttpStatus.TOO_MANY_REQUESTS,
                    error: 'Global rate limit exceeded',
                },
                HttpStatus.TOO_MANY_REQUESTS,
            );
        }

        next();
    }
}
