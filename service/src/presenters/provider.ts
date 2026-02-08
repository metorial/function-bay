import type { Provider } from '../../prisma/generated/client';
import { OBJECT_TYPES } from './objectTypes';

export let providerPresenter = (provider: Provider) => ({
  object: OBJECT_TYPES.provider,

  id: provider.id,
  identifier: provider.identifier,
  name: provider.name,

  createdAt: provider.createdAt
});
