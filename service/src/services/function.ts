import { notFoundError, ServiceError } from '@lowerdeck/error';
import { Paginator } from '@lowerdeck/pagination';
import { Service } from '@lowerdeck/service';
import type { Function, Instance } from '../../prisma/generated/client';
import { db } from '../db';
import { ID, snowflake } from '../id';

let include = {
  currentVersion: true
};

class functionServiceImpl {
  async upsertFunction(d: {
    input: {
      name: string;
      identifier: string;
    };
    instance: Instance;
  }) {
    return await db.function.upsert({
      where: {
        identifier_instanceOid: {
          identifier: d.input.identifier,
          instanceOid: d.instance.oid
        },
        status: 'active'
      },
      update: { name: d.input.name },
      create: {
        oid: snowflake.nextId(),
        id: await ID.generateId('function'),
        name: d.input.name,
        identifier: d.input.identifier,
        instanceOid: d.instance.oid,
        status: 'active'
      },
      include
    });
  }

  async getFunctionById(d: { id: string; instance: Instance }) {
    let func = await db.function.findFirst({
      where: {
        OR: [{ id: d.id }, { identifier: d.id }],
        instanceOid: d.instance.oid,
        status: 'active'
      },
      include
    });
    if (!func) throw new ServiceError(notFoundError('function'));
    return func;
  }

  async listFunctions(d: { instance: Instance }) {
    return Paginator.create(({ prisma }) =>
      prisma(
        async opts =>
          await db.function.findMany({
            ...opts,
            where: {
              instanceOid: d.instance.oid,
              status: 'active'
            },
            include
          })
      )
    );
  }

  async updateFunction(d: {
    function: Function;
    input: {
      name?: string;
    };
  }) {
    return await db.function.update({
      where: { oid: d.function.oid },
      data: {
        name: d.input.name ?? d.function.name
      },
      include
    });
  }

  async deleteFunction(d: { function: Function }) {
    throw new Error('Not implemented');

    return await db.function.update({
      where: { oid: d.function.oid },
      data: { status: 'deleted' },
      include
    });
  }
}

export let functionService = Service.create(
  'functionService',
  () => new functionServiceImpl()
).build();
