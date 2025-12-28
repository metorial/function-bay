import type {
  FunctionBayLayer,
  FunctionBayRuntimeConfig,
  FunctionBayRuntimeSpec
} from '@function-bay/types';
import type {
  Function,
  FunctionDeployment,
  Provider,
  Runtime
} from '../../prisma/generated/client';
import type { ForgeWorkflowStep } from '../forge';

export interface ProviderRuntimeResult {
  runtime: FunctionBayRuntimeConfig;
  layer: FunctionBayLayer;
  workflow: ForgeWorkflowStep[];
  identifier: string;
}

export interface ProviderDeployFunctionParams {
  functionVersion: { id: string };
  function: Function;
  functionDeployment: FunctionDeployment;
  runtimeConfig: FunctionBayRuntimeConfig;
  runtime: Runtime;
  env: Record<string, string>;
  zipFileUrl: string;
}

export interface ProviderDeployFunctionResult {
  providerData: Record<string, any>;
}

export class ProviderImpl {
  #provider: Provider;
  #workflow: ForgeWorkflowStep[];
  #getRuntime: (runtime: FunctionBayRuntimeSpec) => Promise<ProviderRuntimeResult>;
  #deployFunction: (
    params: ProviderDeployFunctionParams
  ) => Promise<ProviderDeployFunctionResult>;

  constructor(d: {
    provider: Provider;
    workflow: ForgeWorkflowStep[];
    getRuntime: (runtime: FunctionBayRuntimeSpec) => Promise<ProviderRuntimeResult>;
    deployFunction: (
      params: ProviderDeployFunctionParams
    ) => Promise<ProviderDeployFunctionResult>;
  }) {
    this.#provider = d.provider;
    this.#workflow = d.workflow;
    this.#getRuntime = d.getRuntime;
    this.#deployFunction = d.deployFunction;
  }

  get identifier() {
    return this.#provider.identifier;
  }

  get provider() {
    return this.#provider;
  }

  get workflow() {
    return this.#workflow;
  }

  get getRuntime() {
    return this.#getRuntime;
  }

  get deployFunction() {
    return this.#deployFunction;
  }
}
