import { runQueueProcessors } from '@lowerdeck/queue';
import { buildProcessors } from './queues/build';

await runQueueProcessors([buildProcessors]);
