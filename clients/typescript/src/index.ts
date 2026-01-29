import { createClient } from '@lowerdeck/rpc-client';
import type { FunctionBayClient } from '../../../service/src/controllers';

type ClientOpts = Parameters<typeof createClient>[0];

export let createFunctionBayClient = (o: ClientOpts) => createClient<FunctionBayClient>(o);
