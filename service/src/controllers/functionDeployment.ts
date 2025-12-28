import { functionBayRuntimeSpec } from '@function-bay/types';
import { Paginator } from '@lowerdeck/pagination';
import { v } from '@lowerdeck/validation';
import { functionDeploymentPresenter, functionDeploymentStepPresenter } from '../presenters';
import { functionDeploymentService } from '../services';
import { app } from './_app';
import { functionApp } from './function';

export let functionDeploymentApp = functionApp.use(async ctx => {
  let functionDeploymentId = ctx.body.functionDeploymentId;
  if (!functionDeploymentId) throw new Error('Function Deployment ID is required');

  let deployment = await functionDeploymentService.getFunctionDeploymentById({
    id: functionDeploymentId,
    function: ctx.function
  });

  return { deployment };
});

export let functionDeploymentController = app.controller({
  create: functionApp
    .handler()
    .input(
      v.object({
        instanceId: v.string(),
        functionId: v.string(),

        name: v.string(),

        runtime: functionBayRuntimeSpec,

        config: v.object({
          memorySizeMb: v.number(),
          timeoutSeconds: v.number()
        }),

        env: v.record(v.string()),
        files: v.array(
          v.object({
            filename: v.string(),
            content: v.string(),
            encoding: v.optional(v.enumOf(['utf-8', 'base64']))
          })
        )
      })
    )
    .do(async ctx => {
      let version = await functionDeploymentService.createFunctionDeployment({
        function: ctx.function,
        instance: ctx.instance,
        input: {
          name: ctx.input.name,
          env: ctx.input.env,
          files: ctx.input.files,
          runtime: ctx.input.runtime,
          config: ctx.input.config
        }
      });
      return functionDeploymentPresenter(version);
    }),

  list: functionApp
    .handler()
    .input(
      Paginator.validate(
        v.object({
          functionId: v.string(),
          instanceId: v.string()
        })
      )
    )
    .do(async ctx => {
      let paginator = await functionDeploymentService.listFunctionDeployments({
        function: ctx.function
      });

      let list = await paginator.run(ctx.input);

      return Paginator.presentLight(list, functionDeploymentPresenter);
    }),

  get: functionDeploymentApp
    .handler()
    .input(
      v.object({
        instanceId: v.string(),
        functionId: v.string(),
        functionDeploymentId: v.string()
      })
    )
    .do(async ctx => functionDeploymentPresenter(ctx.deployment)),

  getOutput: functionDeploymentApp
    .handler()
    .input(
      v.object({
        instanceId: v.string(),
        functionId: v.string(),
        functionDeploymentId: v.string()
      })
    )
    .do(async ctx => {
      let output = await functionDeploymentService.getFunctionDeploymentOutput({
        deployment: ctx.deployment
      });

      return output.steps.map(functionDeploymentStepPresenter);
    })
});
