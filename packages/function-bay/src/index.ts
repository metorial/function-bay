import { tempDir } from '@function-bay/utils';
import path from 'path';

let main = async () => {
  let outputDir = await tempDir();

  let manifestPath =
    process.env.METORIAL_FUNCTION_BAY_MANIFEST_DESTINATION ??
    path.join(outputDir, 'manifest.json');
  let zipPath =
    process.env.METORIAL_FUNCTION_BAY_OUTPUT_DESTINATION ??
    path.join(outputDir, 'function.zip');

  process.env.METORIAL_FUNCTION_BAY_MANIFEST_DESTINATION = manifestPath;
  process.env.METORIAL_FUNCTION_BAY_OUTPUT_DESTINATION = zipPath;

  let builder = await import('@function-bay/nodejs');

  await builder.build();
};

main().catch(err => {
  console.error('Error during build:');
  console.error(err);
  process.exit(1);
});
