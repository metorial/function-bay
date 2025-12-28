import { apiMux } from '@lowerdeck/api-mux';
import { createServer, rpcMux, type InferClient } from '@lowerdeck/rpc-server';
import { app } from './_app';
import { functionController } from './function';
import { functionDeploymentController } from './functionDeployment';
import { functionVersionController } from './functionVersion';
import { instanceController } from './instance';
import { providerController } from './provider';
import { runtimeController } from './runtime';

export let rootController = app.controller({
  runtime: runtimeController,
  instance: instanceController,
  provider: providerController,
  function: functionController,
  functionVersion: functionVersionController,
  functionDeployment: functionDeploymentController
});

export let forgeRPC = createServer({})(rootController);
export let forgeApi = apiMux([{ endpoint: rpcMux({ path: '/metorial-forge' }, [forgeRPC]) }]);

export type ForgeClient = InferClient<typeof rootController>;
