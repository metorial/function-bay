import { functionBayApi } from './controllers';

console.log('Server is running');

Bun.serve({
  fetch: functionBayApi,
  port: 52030
});

await import('./worker');
