import { describe, it, expect, beforeEach } from 'vitest';
import { cleanDatabase } from '../../test/setup';
import { functionBayClient } from '../../test/client';
import { OBJECT_TYPES } from '../../presenters/objectTypes';

describe('provider:getDefault E2E', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  it('returns the default provider', async () => {
    // Provider is auto-seeded at module load time in aws-lambda/provider.ts
    const result = await functionBayClient.provider.getDefault({});

    expect(result).toMatchObject({
      object: OBJECT_TYPES.provider,
      id: expect.any(String),
      identifier: 'aws.lambda',
      name: 'AWS Lambda',
      createdAt: expect.any(Date)
    });
  });
});
