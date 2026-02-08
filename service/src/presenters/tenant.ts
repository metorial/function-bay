import type { Tenant } from '../../prisma/generated/client';
import { OBJECT_TYPES } from './objectTypes';

export let tenantPresenter = (tenant: Tenant) => ({
  object: OBJECT_TYPES.tenant,

  id: tenant.id,
  identifier: tenant.identifier,
  name: tenant.name,

  createdAt: tenant.createdAt
});
