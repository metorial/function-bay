import { createValidatedEnv } from '@lowerdeck/env';
import { v } from '@lowerdeck/validation';

export let env = createValidatedEnv({
  build: {
    METORIAL_FUNCTION_BAY_BUILD_LAYER: v.string(),

    METORIAL_FUNCTION_BAY_MANIFEST_DESTINATION: v.string(),
    METORIAL_FUNCTION_BAY_OUTPUT_DESTINATION: v.string()
  }
});
