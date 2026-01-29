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
      const writer = new FileWriter({ outputDir: 'schemas', suffix: '.schema.ts', mode: 'separate' });

      expect(writer).toBeDefined();
      expect(writer).toBeInstanceOf(FileWriter);
    });
  });

  describe('write test', () => {
    describe('separate mode', () => {
      test('should write schema file to output directory', async () => {
        const writer = new FileWriter({ outputDir: TEST_OUTPUT_DIR });
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
        const writer = new FileWriter({ outputDir: TEST_OUTPUT_DIR });

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
        const writer = new FileWriter({ outputDir: TEST_OUTPUT_DIR });

        const results = await writer.write([]);

        expect(results).toHaveLength(0);
      });

      test('should create  output if ti does not exist', async () => {
        const nestedDir = join(TEST_OUTPUT_DIR, 'nested', 'deep', 'schemas');
        const writer = new FileWriter({ outputDir: nestedDir });
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

      test('should use custom suffix when provided', async () => {
        const writer = new FileWriter({
          outputDir: TEST_OUTPUT_DIR,
          suffix: '.validation.ts',
        });
        const code = 'export const userValidation = {};';

        const results = await writer.write([{ code, sourcePath: 'src/user.ts' }]);

        expect(results).toHaveLength(1);
        if (results[0]) {
          expect(results[0].filePath).toBe(join(TEST_OUTPUT_DIR, 'user.validation.ts'));
          expect(await Bun.file(results[0].filePath).exists()).toBe(true);
        }
        expect.assertions(3);
      });

      test('should overwrite existing file', async () => {
        const writer = new FileWriter({ outputDir: TEST_OUTPUT_DIR });
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

      test('should handle different file path formats', async () => {
        const writer = new FileWriter({ outputDir: TEST_OUTPUT_DIR });
        const code = 'export const test = {};';

        const testCases = [
          'user.ts',
          './user.ts',
          'src/user.ts',
          './src/user.ts',

          'src/dto/user.ts',
          'src/models/domain/user.ts',

          'UserDTO.ts',
          'user_dto.ts',
          'user-dto.ts',
        ];

        const files = testCases.map((sourcePath) => ({ code, sourcePath }));
        const results = await writer.write(files);

        expect(results).toHaveLength(testCases.length);
        for (const result of results) {
          expect(await Bun.file(result.filePath).exists()).toBe(true);
        }
      });
    });
  });
});
