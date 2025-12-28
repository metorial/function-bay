import type { Provider, Runtime } from '../../prisma/generated/client';
import { providerPresenter } from './provider';

export let runtimePresenter = (runtime: Runtime & { provider: Provider }) => ({
  object: 'runtime',

  id: runtime.id,
  identifier: runtime.identifier,
  name: runtime.name,

  specification: runtime.configuration.runtime,
  layer: runtime.configuration.layer,

  provider: providerPresenter(runtime.provider),

  createdAt: runtime.createdAt
});
