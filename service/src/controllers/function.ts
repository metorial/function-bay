import { Paginator } from '@lowerdeck/pagination';
import { v } from '@lowerdeck/validation';
import { functionPresenter } from '../presenters/function';
import { functionService } from '../services';
import { functionInvocationService } from '../services/functionInvocation';
import { app } from './_app';
import { instanceApp } from './instance';

export let functionApp = instanceApp.use(async ctx => {
  let functionId = ctx.body.functionId;
  if (!functionId) throw new Error('Function ID is required');

  let func = await functionService.getFunctionById({
    id: functionId,
    instance: ctx.instance
  });

  return { function: func };
});

export let functionController = app.controller({
  upsert: instanceApp
    .handler()
    .input(
      v.object({
        instanceId: v.string(),

        name: v.string(),
        identifier: v.string()
      })
    )
    .do(async ctx => {
      let func = await functionService.upsertFunction({
        instance: ctx.instance,
        input: {
          name: ctx.input.name,
          identifier: ctx.input.identifier
        }
      });
      return functionPresenter(func);
    }),

  list: instanceApp
    .handler()
    .input(
      Paginator.validate(
        v.object({
          instanceId: v.string()
        })
      )
    )
    .do(async ctx => {
      let paginator = await functionService.listFunctions({
        instance: ctx.instance
      });

      let list = await paginator.run(ctx.input);

      return Paginator.presentLight(list, functionPresenter);
    }),

  get: functionApp
    .handler()
    .input(
      v.object({
        instanceId: v.string(),
        functionId: v.string()
      })
    )
    .do(async ctx => functionPresenter(ctx.function)),

  update: functionApp
    .handler()
    .input(
      v.object({
        instanceId: v.string(),
        functionId: v.string(),

        name: v.optional(v.string())
      })
    )
    .do(async ctx => {
      let func = await functionService.updateFunction({
        function: ctx.function,
        input: {
          name: ctx.input.name
        }
      });

      return functionPresenter(func);
    }),

  invoke: app
    .handler()
    .input(
      v.object({
        instanceId: v.string(),
        functionId: v.string(),

        payload: v.record(v.any())
      })
    )
    .do(
      async ctx =>
        await functionInvocationService.invokeFunction({
          functionId: ctx.input.functionId,
          instanceId: ctx.input.instanceId,
          payload: ctx.input.payload
        })
    )
});
