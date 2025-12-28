import { forgeApi } from './controllers';

console.log('Server is running');

Bun.serve({
  fetch: forgeApi,
  port: 52030
});

await import('./worker');
