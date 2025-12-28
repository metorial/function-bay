import { canonicalize } from '@lowerdeck/canonicalize';
import { Hash } from '@lowerdeck/hash';
import { createForgeClient } from '@metorial-services/forge-client';
import type { Instance, Runtime } from '../prisma/generated/client';
import { db } from './db';
import { env } from './env';
import { snowflake } from './id';

export let forge = createForgeClient({
  endpoint: env.forge.FORGE_API_URL
});

export type ForgeWorkflowStep =
  | {
      name: string;
      type: 'script';
      initScript: string[] | undefined;
      actionScript: string[];
      cleanupScript: string[] | undefined;
    }
  | {
      name: string;
      type: 'download_artifact';
      artifactId: string;
      artifactDestinationPath: string;
    }
  | {
      name: string;
      type: 'upload_artifact';
      artifactSourcePath: string;
      artifactName: string;
    };

export let ensureForgeInstance = async (instance: Instance) =>
  await forge.instance.upsert({
    name: instance.name,
    identifier: instance.identifier
  });

export let ensureForgeWorkflow = async (d: {
  instance: Instance;
  runtime: Runtime;

  steps: ForgeWorkflowStep[];
}) => {
  let workflow = await db.runtimeForgeWorkflow.findUnique({
    where: {
      runtimeOid_instanceOid: {
        runtimeOid: d.runtime.oid,
        instanceOid: d.instance.oid
      }
    }
  });

  if (workflow) {
    return await forge.workflow.get({
      instanceId: workflow.forgeInstanceId,
      workflowId: workflow.forgeWorkflowId
    });
  }

  let instance = await ensureForgeInstance(d.instance);

  let createdWorkflow = await forge.workflow.upsert({
    instanceId: instance.id,
    identifier: `fncbay_builder_${d.runtime.identifier}`,
    name: `Function Bay Builder for ${d.runtime.name}`
  });

  let hash = await Hash.sha256(canonicalize(d.steps));

  let version = await forge.workflowVersion.create({
    instanceId: instance.id,
    workflowId: createdWorkflow.id,
    name: `Function Bay (${hash.slice(0, 8)})`,
    steps: d.steps
  });

  // Upsert to avoid race conditions
  await db.runtimeForgeWorkflow.upsert({
    where: {
      runtimeOid_instanceOid: {
        runtimeOid: d.runtime.oid,
        instanceOid: d.instance.oid
      }
    },
    create: {
      oid: await snowflake.nextId(),
      runtimeOid: d.runtime.oid,
      instanceOid: d.instance.oid,
      forgeWorkflowId: createdWorkflow.id,
      forgeInstanceId: instance.id,
      forgeWorkflowVersionId: version.id
    },
    update: {}
  });

  return createdWorkflow;
};
