import type { Function, FunctionVersion } from '../../prisma/generated/client';
import { OBJECT_TYPES } from './objectTypes';

export let functionPresenter = (
  func: Function & { currentVersion: FunctionVersion | null }
) => ({
  object: OBJECT_TYPES.function,

  currentVersionId: func.currentVersion?.id ?? null,

  id: func.id,
  status: func.status,

  identifier: func.identifier,
  name: func.name,

  createdAt: func.createdAt,
  updatedAt: func.updatedAt
});
