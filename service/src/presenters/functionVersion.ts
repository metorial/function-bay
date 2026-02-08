import type {
  Function,
  FunctionVersion,
  Provider,
  Runtime
} from '../../prisma/generated/client';
import { OBJECT_TYPES } from './objectTypes';
import { functionPresenter } from './function';
import { runtimePresenter } from './runtime';

export let functionVersionPresenter = (
  version: FunctionVersion & {
    function: Function & {
      currentVersion: FunctionVersion | null;
    };
    runtime: Runtime & {
      provider: Provider;
    };
  }
) => ({
  object: OBJECT_TYPES.functionVersion,

  id: version.id,
  identifier: version.identifier,
  name: version.name,

  configuration: version.configuration,

  isCurrent: version.function.currentVersion?.oid === version.oid,

  function: functionPresenter(version.function),
  runtime: runtimePresenter(version.runtime),

  createdAt: version.createdAt
});
