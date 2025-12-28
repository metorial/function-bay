import type { FunctionBayRuntimeSpec } from '@function-bay/types';
import { notFoundError, ServiceError } from '@lowerdeck/error';
import { generatePlainId } from '@lowerdeck/id';
import { Paginator } from '@lowerdeck/pagination';
import { Service } from '@lowerdeck/service';
import type { Function, Instance } from '../../prisma/generated/client';
import { db } from '../db';
import { encryption } from '../encryption';
import { ID, snowflake } from '../id';
import { defaultProvider } from '../providers';
import { startBuildQueue } from '../queues/build';

let include = {
  function: {
    include: {
      currentVersion: true
    }
  },
  runtime: {
    include: {
      provider: true
    }
  },
  functionVersion: true,
  steps: true
};

class functionDeploymentServiceImpl {
  async createFunctionDeployment(d: {
    function: Function;
    instance: Instance;
    input: {
      name: string;
      env: Record<string, string>;
      files: {
        filename: string;
        content: string;
        encoding?: 'utf-8' | 'base64';
      }[];
      runtime: FunctionBayRuntimeSpec;
      config: PrismaJson.FunctionConfiguration;
    };
  }) {
    let identifier = generatePlainId(6);

    let providerRuntime = await defaultProvider.getRuntime(d.input.runtime);

    let id = await ID.generateId('functionDeployment');
    let deployment = await db.functionDeployment.create({
      data: {
        oid: snowflake.nextId(),
        id: await ID.generateId('functionDeployment'),
        status: 'pending',
        identifier,
        name: d.input.name,
        configuration: d.input.config,
        runtimeOid: providerRuntime.runtime.oid,
        functionOid: d.function.oid,

        steps: {
          create: [
            {
              oid: snowflake.nextId(),
              id: await ID.generateId('functionDeploymentStep'),
              status: 'pending',
              type: 'deploy',
              name: 'Deploy Function',
              output: ''
            }
          ]
        },

        encryptedEnvironmentVariables: await encryption.encrypt({
          secret: JSON.stringify(d.input.env),
          entityId: id
        })
      },
      include
    });

    await startBuildQueue.add({ deploymentId: deployment.id, files: d.input.files });

    return deployment;
  }

  async getFunctionDeploymentById(d: { id: string; function: Function }) {
    let functionDeployment = await db.functionDeployment.findFirst({
      where: {
        OR: [{ id: d.id }, { identifier: d.id }],
        functionOid: d.function.oid
      },
      include
    });
    if (!functionDeployment) throw new ServiceError(notFoundError('function.version'));
    return functionDeployment;
  }

  async listFunctionDeployments(d: { function: Function }) {
    return Paginator.create(({ prisma }) =>
      prisma(
        async opts =>
          await db.functionDeployment.findMany({
            ...opts,
            where: {
              functionOid: d.function.oid
            },
            include
          })
      )
    );
  }
}

export let functionDeploymentService = Service.create(
  'functionDeploymentService',
  () => new functionDeploymentServiceImpl()
).build();
