import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { SchemaGen } from './schema-gen';
import type { Config } from '@types';

const TEST_DIR = join(process.cwd(), 'test-schema-gen');

describe('SchemaGen Test', () => {
  beforeEach(async () => {
    await rm(TEST_DIR, { recursive: true, force: true });
    await mkdir(join(TEST_DIR, 'src'), { recursive: true });
  });

  afterEach(async () => {
    await rm(TEST_DIR, { recursive: true, force: true });
  });

  test('should generate zod schema file', async () => {
    const sourcePath = join(TEST_DIR, 'src', 'user.ts');
    await Bun.write(
      sourcePath,
      `export class User {
  id: string;
  age?: number;
}`,
    );

    const config: Config = {
      generator: 'zod',
      mappings: [
        {
          include: [sourcePath],
          output: {
            pattern: join(TEST_DIR, 'schemas', '{filename}.schema.ts'),
          },
        },
      ],
      overwrite: true,
    };

    const result = await new SchemaGen(config).run();
    const schemaPath = join(TEST_DIR, 'schemas', 'user.schema.ts');

    expect(result.schemasGenerated).toBe(1);
    expect(result.filesCreated).toBe(1);
    expect(await Bun.file(schemaPath).exists()).toBe(true);

    const content = await Bun.file(schemaPath).text();
    expect(content).toContain('import { z } from "zod"');
    expect(content).toContain('export const userSchema = z.object({');
    expect(content).toContain('id: z.string()');
    expect(content).toContain('age: z.number().optional()');
  });
});
