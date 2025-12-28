import {
  FunctionBayLayer,
  FunctionBayRuntimeConfig,
  functionBayRuntimeConfig
} from '@function-bay/types';
import {
  createZipFromDirectory,
  createZipFromFiles,
  hashFile,
  waitForStream
} from '@function-bay/utils';
import fs from 'fs';
import { env } from '../env';

let existingFunctionRef = { current: false };

export type FunctionDefinition = {
  runtime: FunctionBayRuntimeConfig;
} & (
  | { files: { filename: string; content: string; encoding?: 'utf-8' | 'base64' }[] }
  | { directory: string }
);

export class Function {
  #runtime: FunctionBayRuntimeConfig;
  #promise: Promise<void>;

  private constructor(func: FunctionDefinition) {
    if (existingFunctionRef.current) {
      throw new Error('Only one Function instance can be created per build.');
    }
    existingFunctionRef.current = true;

    let valRes = functionBayRuntimeConfig.validate(func.runtime);
    if (!valRes.success) {
      throw new Error(
        `Invalid function runtime config: ${JSON.stringify(valRes.errors, null, 2)}`
      );
    }

    this.#runtime = valRes.value;

    this.#promise = (async () => {
      let zipFileStream: NodeJS.ReadableStream;
      let out = env.build.METORIAL_FUNCTION_BAY_OUTPUT_DESTINATION;

      if ('directory' in func) {
        zipFileStream = await createZipFromDirectory(func.directory);
      } else {
        zipFileStream = createZipFromFiles(func.files);
      }

      let outputStream = fs.createWriteStream(out);
      zipFileStream.pipe(outputStream);

      await waitForStream(outputStream);

      fs.writeFileSync(
        env.build.METORIAL_FUNCTION_BAY_MANIFEST_DESTINATION,
        JSON.stringify({
          runtime: func.runtime,
          hash: await hashFile(out, 'sha256')
        }),
        'utf-8'
      );
    })();
  }

  static async create(func: FunctionDefinition): Promise<Function> {
    let f = new Function(func);
    await f.#promise;
    return f;
  }

  get runtime(): FunctionBayRuntimeConfig {
    return this.#runtime;
  }

  get layer(): FunctionBayLayer {
    return this.#runtime.layer;
  }

  get handler(): string {
    return this.#runtime.handler;
  }
}
