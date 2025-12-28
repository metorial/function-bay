import type {
  FunctionBayLayer,
  FunctionBayRuntimeConfig,
  FunctionBayRuntimeSpec
} from '@function-bay/types';
import type { Provider } from '../../prisma/generated/client';
import type { ForgeWorkflowStep } from '../forge';

export class ProviderImpl {
  #provider: Provider;
  #workflow: ForgeWorkflowStep[];
  #getRuntime: (runtime: FunctionBayRuntimeSpec) => Promise<{
    runtime: FunctionBayRuntimeConfig;
    layer: FunctionBayLayer;
    workflow: ForgeWorkflowStep[];
    identifier: string;
  }>;

  constructor(d: {
    provider: Provider;
    workflow: ForgeWorkflowStep[];
    getRuntime: (runtime: FunctionBayRuntimeSpec) => Promise<{
      runtime: FunctionBayRuntimeConfig;
      layer: FunctionBayLayer;
      workflow: ForgeWorkflowStep[];
      identifier: string;
    }>;
  }) {
    this.#provider = d.provider;
    this.#workflow = d.workflow;
    this.#getRuntime = d.getRuntime;
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

  async getRuntime(runtime: FunctionBayRuntimeSpec): Promise<{
    runtime: FunctionBayRuntimeConfig;
    layer: FunctionBayLayer;
    workflow: ForgeWorkflowStep[];
    identifier: string;
  }> {
    return await this.#getRuntime(runtime);
  }
}
