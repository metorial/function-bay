import { functionBayLayer, FunctionBayLayer } from '@function-bay/types';
import { env } from '../env';

let specVal = functionBayLayer.validate(
  JSON.parse(env.build.METORIAL_FUNCTION_BAY_BUILD_LAYER)
);
if (!specVal.success) {
  throw new Error(`Invalid build spec: ${JSON.stringify(specVal.errors, null, 2)}`);
}

let spec = specVal.value;

export class Runtime {
  static get buildSpec() {
    return spec as FunctionBayLayer;
  }

  static get layer() {
    return spec as FunctionBayLayer;
  }

  static get identifier() {
    return spec.identifier;
  }

  static get provider() {
    return spec.provider;
  }

  static get version() {
    return spec.version;
  }

  static get os() {
    return spec.os;
  }

  static get osIdentifier() {
    return spec.osIdentifier;
  }

  static get arch() {
    return spec.arch;
  }
}
