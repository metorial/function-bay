import { env } from '../env';
import { awsLambda } from './aws-lambda';

export let providers = [awsLambda];
export let defaultProvider = providers.find(
  p => p.identifier == env.provider.DEFAULT_PROVIDER
)!;
