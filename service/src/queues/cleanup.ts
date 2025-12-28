import { createCron } from '@lowerdeck/cron';
import { subDays } from 'date-fns';
import { db } from '../db';
import { env } from '../env';

export let cleanupProcessor = createCron(
  {
    name: 'fbay/cleanup',
    cron: '0 0 * * *',
    redisUrl: env.service.REDIS_URL
  },
  async () => {
    let threeDaysAgo = subDays(new Date(), 3);

    await db.functionInvocation.deleteMany({
      where: { createdAt: { lt: threeDaysAgo } }
    });
  }
);
