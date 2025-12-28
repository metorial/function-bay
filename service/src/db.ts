import type { FunctionBayLayer, FunctionBayRuntimeSpec } from '@function-bay/types';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../prisma/generated/client';

let adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

export let db = new PrismaClient({ adapter });

declare global {
  namespace PrismaJson {
    interface FunctionConfiguration {
      memorySizeMb: number;
      timeoutSeconds: number;
    }

    interface RuntimeConfiguration {
      runtime: FunctionBayRuntimeSpec;
      layer: FunctionBayLayer;
    }
  }
}
