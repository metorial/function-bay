import { functionBayRuntimeConfig, type FunctionBayRuntimeConfig } from '@function-bay/types';
import { combineQueueProcessors, createQueue, QueueRetryError } from '@lowerdeck/queue';
import { v } from '@lowerdeck/validation';
import { db } from '../db';
import { encryption } from '../encryption';
import { env } from '../env';
import { ensureForgeWorkflow, forge } from '../forge';
import { defaultProvider } from '../providers';
import { layer } from '../providers/aws-lambda/runtime';
import { MANIFEST_ARTIFACT_NAME, MANIFEST_PATH, OUTPUT_ZIP_PATH } from '../providers/const';

export let startBuildQueue = createQueue<{
  deploymentId: string;
  files: { filename: string; content: string; encoding?: 'utf-8' | 'base64' }[];
}>({
  name: 'fbay/build/start',
  redisUrl: env.service.REDIS_URL
});

let startBuildQueueProcessor = startBuildQueue.process(async data => {
  let deployment = await db.functionDeployment.findFirst({
    where: { id: data.deploymentId },
    include: {
      runtime: true,
      function: {
        include: {
          instance: true
        }
      }
    }
  });
  if (!deployment) throw new QueueRetryError();

  let workflow = await ensureForgeWorkflow({
    instance: deployment.function.instance,
    runtime: deployment.runtime,
    steps: defaultProvider.workflow
  });

  let envVars: Record<string, string> = await encryption.decrypt({
    entityId: deployment.id,
    encrypted: deployment.encryptedEnvironmentVariables
  });

  let run = await forge.workflowRun.create({
    instanceId: deployment.function.instance.identifier,
    workflowId: workflow.id,
    files: data.files,

    env: {
      ...envVars,

      METORIAL_FUNCTION_BAY_MANIFEST_DESTINATION: MANIFEST_PATH,
      METORIAL_FUNCTION_BAY_OUTPUT_DESTINATION: OUTPUT_ZIP_PATH,
      METORIAL_FUNCTION_BAY_BUILD_LAYER: JSON.stringify(layer)
    }
  });

  await db.functionDeployment.update({
    where: { oid: deployment.oid },
    data: { status: 'running', forgeRunId: run.id, forgeWorkflowId: workflow.id }
  });

  await monitorBuildQueue.add({
    deploymentId: deployment.id,

    runId: run.id,
    workflowId: workflow.id,
    instanceId: deployment.function.instance.identifier
  });
});

let monitorBuildQueue = createQueue<{
  deploymentId: string;
  runId: string;
  workflowId: string;
  instanceId: string;
}>({
  name: 'fbay/build/mon',
  redisUrl: env.service.REDIS_URL
});

let monitorBuildQueueProcessor = monitorBuildQueue.process(async data => {
  let run = await forge.workflowRun.get({
    instanceId: data.instanceId,
    workflowId: data.workflowId,
    workflowRunId: data.runId
  });

  if (run.status == 'failed' || run.status == 'succeeded') {
    await workflowFinishedBuildQueue.add(data);
  } else {
    await monitorBuildQueue.add(data, { delay: 5000 });
  }
});

let workflowFinishedBuildQueue = createQueue<{
  deploymentId: string;
  runId: string;
  workflowId: string;
  instanceId: string;
}>({
  name: 'fbay/build/wfin',
  redisUrl: env.service.REDIS_URL
});

let workflowFinishedBuildQueueProcessor = workflowFinishedBuildQueue.process(async data => {
  let run = await forge.workflowRun.get({
    instanceId: data.instanceId,
    workflowId: data.workflowId,
    workflowRunId: data.runId
  });

  if (run.status == 'succeeded') {
    let manifestArtifact = run.artifacts.find(a => a.name === MANIFEST_ARTIFACT_NAME);
    let outputArtifact = run.artifacts.find(a => a.name === OUTPUT_ZIP_PATH);

    if (!manifestArtifact || !outputArtifact) {
      await errorQueue.add({
        deploymentId: data.deploymentId,
        code: 'build_runtime_error',
        message: 'The build runtime did not produce the expected artifacts.'
      });
      return;
    }

    let manifest = await fetch(manifestArtifact.url.url).then(res => res.json());

    let valRes = v
      .object({
        hash: v.string(),
        runtime: functionBayRuntimeConfig
      })
      .validate(manifest);
    if (!valRes.success) {
      await errorQueue.add({
        deploymentId: data.deploymentId,
        code: 'build_invalid_manifest',
        message: `The build runtime produced an invalid manifest: ${JSON.stringify(
          valRes.errors
        )}`
      });
      return;
    }

    await deployToRuntimeQueue.add({
      deploymentId: data.deploymentId,
      outputUrl: outputArtifact.url.url,
      manifest: valRes.value as any
    });
  } else {
    await errorQueue.add({
      deploymentId: data.deploymentId,
      code: 'build_failed',
      message: 'The build workflow run failed.'
    });
  }
});

let deployToRuntimeQueue = createQueue<{
  deploymentId: string;
  manifest: {
    hash: string;
    runtime: FunctionBayRuntimeConfig;
  };
  outputUrl: string;
}>({
  name: 'fbay/build/drun',
  redisUrl: env.service.REDIS_URL
});

let deployToRuntimeQueueProcessor = deployToRuntimeQueue.process(async data => {
  let deployment = await db.functionDeployment.findFirst({
    where: { id: data.deploymentId }
  });
  if (!deployment) throw new QueueRetryError();

  let output = JSON.stringify([Date.now(), 'Deploying function to runtime...']);
  await db.functionDeploymentStep.updateMany({
    where: { functionDeploymentOid: deployment.oid, type: 'deploy' },
    data: { status: 'running', output }
  });

  // TODO: deploy to runtime

  output += `\n${JSON.stringify([Date.now(), 'Function deployed successfully.'])}`;
  await db.functionDeploymentStep.updateMany({
    where: { functionDeploymentOid: deployment.oid, type: 'deploy' },
    data: { status: 'succeeded', output }
  });
});

let errorQueue = createQueue<{
  deploymentId: string;
  code: string;
  message: string;
}>({
  name: 'fbay/build/err',
  redisUrl: env.service.REDIS_URL
});

let errorQueueProcessor = errorQueue.process(async data => {
  let deployment = await db.functionDeployment.update({
    where: { id: data.deploymentId },
    data: {
      status: 'failed',
      errorCode: data.code,
      errorMessage: data.message
    }
  });

  await db.functionDeploymentStep.updateMany({
    where: {
      functionDeploymentOid: deployment.oid,
      status: 'pending'
    },
    data: {
      status: 'failed'
    }
  });
});

export let buildProcessors = combineQueueProcessors([
  startBuildQueueProcessor,
  monitorBuildQueueProcessor,
  workflowFinishedBuildQueueProcessor,
  deployToRuntimeQueueProcessor,
  errorQueueProcessor
]);
