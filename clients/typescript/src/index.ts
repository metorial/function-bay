import { createClient } from '@lowerdeck/rpc-client';
import { ClientOpts } from '@lowerdeck/rpc-client/dist/shared/clientBuilder';
import type { FunctionBayClient } from '../../../service/src/controllers';

export let createFunctionBayClient = (o: ClientOpts) => createClient<FunctionBayClient>(o);
