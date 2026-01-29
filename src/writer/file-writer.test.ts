import { describe, beforeEach, afterEach, test, expect } from 'bun:test';
import { rm } from 'fs/promises';
import { join } from 'path';
import { FileWriter } from './file-writer';

const TEST_OUTPUT_DIR = join(process.cwd(), 'test-output');

describe('FileWriter Test', () => {
  beforeEach(async () => {
    await rm(TEST_OUTPUT_DIR, { recursive: true, force: true });
  });

  afterEach(async () => {
    await rm(TEST_OUTPUT_DIR, { recursive: true, force: true });
  });

  describe('constructor test', () => {
    test('should create instance', () => {
      const writer = new FileWriter({ pattern: join(TEST_OUTPUT_DIR, '{filename}.schema.ts'), mode: 'separate' });

      expect(writer).toBeDefined();
      expect(writer).toBeInstanceOf(FileWriter);
    });
  });

  describe('write test', () => {
    describe('separate mode', () => {
      test('should write schema file to output directory', async () => {
        const writer = new FileWriter({ pattern: join(TEST_OUTPUT_DIR, '{filename}.schema.ts') });
        const code = `export const userSchema = test.Object({})`;

        const results = await writer.write([{ code, sourcePath: 'test.ts' }]);

        expect(results).toHaveLength(1);
        if (results[0]) {
          const result = results[0];
          expect(result.filePath).toBe(join(TEST_OUTPUT_DIR, 'test.schema.ts'));
          expect(result.created).toBe(true);
          expect(await Bun.file(result.filePath).exists()).toBe(true);
          expect(await Bun.file(result.filePath).text()).toBe(code);
        }
        expect.assertions(5);
      });

      test('should write multiple schema files at once', async () => {
        const writer = new FileWriter({ pattern: join(TEST_OUTPUT_DIR, '{filename}.schema.ts') });

        const files = [
          { code: 'export const userSchema = t.Object({})', sourcePath: 'user.ts' },
          { code: 'export const postSchema = t.Object({})', sourcePath: 'post.ts' },
          { code: 'export const commentSchema = t.Object({})', sourcePath: 'comment.ts' },
        ];

        const results = await writer.write(files);

        expect(results).toHaveLength(files.length);
        expect(results.every((result) => result.created)).toBe(true);

        for (let i = 0; i < files.length; i++) {
          const { code } = files[i]!;
          const result = results[i];

          if (result) {
            expect(await Bun.file(result.filePath).exists()).toBe(true);
            expect(await Bun.file(result.filePath).text()).toBe(code);
          }
        }

        expect.assertions(files.length * 2 + 2);
      });

      test('should handle empty array', async () => {
        const writer = new FileWriter({ pattern: join(TEST_OUTPUT_DIR, '{filename}.schema.ts') });

        const results = await writer.write([]);

        expect(results).toHaveLength(0);
      });

      test('should create output directory if it does not exist', async () => {
        const nestedDir = join(TEST_OUTPUT_DIR, 'nested', 'deep', 'schemas');
        const writer = new FileWriter({ pattern: join(nestedDir, '{filename}.schema.ts') });
        const code = 'export const test = {};';

        const results = await writer.write([{ code, sourcePath: 'test.ts' }]);

        expect(results).toHaveLength(1);
        if (results[0]) {
          expect(results[0].filePath).toBe(join(nestedDir, 'test.schema.ts'));
          const file = Bun.file(results[0].filePath);
          expect(await file.exists()).toBe(true);
        }
        expect.assertions(3);
      });

      test('should overwrite existing file', async () => {
        const writer = new FileWriter({ pattern: join(TEST_OUTPUT_DIR, '{filename}.schema.ts') });
        const firstCode = 'export const v1 = {};';
        const secondCode = 'export const v2 = {};';

        const results1 = await writer.write([{ code: firstCode, sourcePath: 'user.ts' }]);
        if (results1[0]) {
          expect(results1[0].created).toBe(true);
          expect(await Bun.file(results1[0].filePath).text()).toBe(firstCode);
          const results2 = await writer.write([{ code: secondCode, sourcePath: 'user.ts' }]);
          if (results2[0]) {
            expect(results2[0].created).toBe(false);
            expect(results2[0].filePath).toBe(results1[0].filePath);
            const content = await Bun.file(results2[0].filePath).text();
            expect(content).toBe(secondCode);
          }
        }
        expect.assertions(5);
      });

      test.each([
        { sourcePath: 'user.ts', description: 'simple filename' },
        { sourcePath: './user.ts', description: 'current directory prefix' },
        { sourcePath: 'src/user.ts', description: 'nested path' },
        { sourcePath: './src/user.ts', description: 'current directory with nested' },
        { sourcePath: 'src/dto/user.ts', description: 'deeply nested path' },
        { sourcePath: 'src/models/domain/user.ts', description: 'very deeply nested path' },
        { sourcePath: 'UserDTO.ts', description: 'PascalCase filename' },
        { sourcePath: 'user_dto.ts', description: 'underscore filename' },
        { sourcePath: 'user-dto.ts', description: 'hyphen filename' },
      ])('should handle different file path formats: $description', async ({ sourcePath }) => {
        const writer = new FileWriter({ pattern: join(TEST_OUTPUT_DIR, '{filename}.schema.ts') });
        const code = 'export const test = {};';

        const results = await writer.write([{ code, sourcePath }]);

        expect(results).toHaveLength(1);
        if (results[0]) {
          expect(await Bun.file(results[0].filePath).exists()).toBe(true);
        }
        expect.assertions(2);
      });

      test.each([
        {
          description: 'user model',
          sourcePath: 'src/models/user.ts',
          expected: join(TEST_OUTPUT_DIR, 'route', 'user', 'schema.ts'),
        },
        {
          description: 'product model',
          sourcePath: 'src/models/product.ts',
          expected: join(TEST_OUTPUT_DIR, 'route', 'product', 'schema.ts'),
        },
      ])('should handle models to route schemas pattern: $description', async ({ sourcePath, expected }) => {
        const writer = new FileWriter({
          pattern: join(TEST_OUTPUT_DIR, 'route', '{filename}', 'schema.ts'),
        });

        const results = await writer.write([{ code: 'test', sourcePath }]);

        if (results[0]) {
          expect(results[0].filePath).toBe(expected);
          expect(await Bun.file(results[0].filePath).exists()).toBe(true);
        }
        expect.assertions(2);
      });

      test.each([
        {
          description: 'user dto',
          sourcePath: 'src/dto/user.dto.ts',
          expected: join(TEST_OUTPUT_DIR, 'api', 'schemas', 'user.dto.schema.ts'),
        },
        {
          description: 'product dto',
          sourcePath: 'src/dto/product.dto.ts',
          expected: join(TEST_OUTPUT_DIR, 'api', 'schemas', 'product.dto.schema.ts'),
        },
      ])('should handle dto to api schemas pattern: $description', async ({ sourcePath, expected }) => {
        const writer = new FileWriter({
          pattern: join(TEST_OUTPUT_DIR, 'api', 'schemas', '{filename}.schema.ts'),
        });

        const results = await writer.write([{ code: 'test', sourcePath }]);

        if (results[0]) {
          expect(results[0].filePath).toBe(expected);
          expect(await Bun.file(results[0].filePath).exists()).toBe(true);
        }
        expect.assertions(2);
      });

      test.each([
        {
          description: 'user model',
          sourcePath: 'src/models/user.ts',
          expected: join(TEST_OUTPUT_DIR, 'schemas', 'user.schema.ts'),
        },
        {
          description: 'product dto',
          sourcePath: 'src/dto/product.dto.ts',
          expected: join(TEST_OUTPUT_DIR, 'schemas', 'product.dto.schema.ts'),
        },
        {
          description: 'order api',
          sourcePath: 'src/api/order.ts',
          expected: join(TEST_OUTPUT_DIR, 'schemas', 'order.schema.ts'),
        },
      ])('should handle flat output directory pattern: $description', async ({ sourcePath, expected }) => {
        const writer = new FileWriter({
          pattern: join(TEST_OUTPUT_DIR, 'schemas', '{filename}.schema.ts'),
        });

        const results = await writer.write([{ code: 'test', sourcePath }]);

        if (results[0]) {
          expect(results[0].filePath).toBe(expected);
          expect(await Bun.file(results[0].filePath).exists()).toBe(true);
        }
        expect.assertions(2);
      });
    });
  });
});
