import { ProviderImpl } from '../_lib';
import { deployFunction } from './deploy';
import { provider } from './provider';
import { getRuntime } from './runtime';
import { workflow } from './workflow';

export let awsLambda = new ProviderImpl({
  provider,
  workflow,
  getRuntime,
  deployFunction
});
