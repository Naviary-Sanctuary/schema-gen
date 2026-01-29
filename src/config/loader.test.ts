import { describe, expect, test, beforeEach, afterEach } from 'bun:test';
import { ConfigLoader } from './loader';
import { ConfigNotFoundError, ConfigParseError, ConfigValidationError } from '@libs/errors';
import { rm, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const TEST_DIR = join(process.cwd(), 'test-configs');

/**
 * Helper: Create a config file for testing
 */
async function createConfigFile(filename: string, content: string): Promise<string> {
  await mkdir(TEST_DIR, { recursive: true });
  const path = join(TEST_DIR, filename);
  await Bun.write(path, content);
  return path;
}

describe('ConfigLoader', () => {
  beforeEach(async () => {
    await rm(TEST_DIR, { recursive: true, force: true });
    await mkdir(TEST_DIR, { recursive: true });
  });

  afterEach(async () => {
    await rm(TEST_DIR, { recursive: true, force: true });
  });

  describe('constructor', () => {
    test('should use default config path when not provided', () => {
      const loader = new ConfigLoader();
      expect(loader.configPath).toBe(join(process.cwd(), 'schema-gen.config.json'));
    });

    test('should use custom config path when provided', () => {
      const customPath = './custom-config.json';
      const loader = new ConfigLoader(customPath);
      expect(loader.configPath).toBe(join(process.cwd(), customPath));
    });
  });

  describe('load', () => {
    describe('success cases', () => {
      test('should load valid config with all required fields', async () => {
        const configPath = await createConfigFile(
          'valid-minimal.json',
          JSON.stringify({
            mappings: [
              {
                include: ['src/**/*.ts'],
                output: { pattern: 'schemas/{filename}.schema.ts' },
              },
            ],
            generator: 'typebox',
          }),
        );

        const loader = new ConfigLoader(configPath);
        const config = await loader.load();

        expect(config.mappings).toHaveLength(1);
        expect(config.mappings[0]?.include).toEqual(['src/**/*.ts']);
        expect(config.mappings[0]?.output.pattern).toBe('schemas/{filename}.schema.ts');
        expect(config.generator).toBe('typebox');
      });

      test('should load valid config with all optional fields', async () => {
        const configPath = await createConfigFile(
          'valid-full.json',
          JSON.stringify({
            mappings: [
              {
                include: ['src/**/*.ts'],
                output: { pattern: 'schemas/{filename}.schema.ts' },
              },
            ],
            generator: 'typebox',
            mode: 'separate',
            exclude: ['**/*.test.ts', '**/*.spec.ts'],
          }),
        );

        const loader = new ConfigLoader(configPath);
        const config = await loader.load();

        expect(config.mode).toBe('separate');
        expect(config.exclude).toEqual(['**/*.test.ts', '**/*.spec.ts']);
      });

      test('should support multiple mappings', async () => {
        const configPath = await createConfigFile(
          'multiple-mappings.json',
          JSON.stringify({
            mappings: [
              {
                include: ['src/models/**/*.ts'],
                output: { pattern: 'src/route/{filename}/schema.ts' },
              },
              {
                include: ['src/dto/**/*.ts'],
                output: { pattern: 'src/api/schemas/{filename}.schema.ts' },
              },
              {
                include: ['src/entities/**/*.ts'],
                output: { pattern: 'schemas/entities/{filename}.ts' },
              },
            ],
            generator: 'elysia',
          }),
        );

        const loader = new ConfigLoader(configPath);
        const config = await loader.load();

        expect(config.mappings).toHaveLength(3);
        expect(config.mappings[0]?.include).toEqual(['src/models/**/*.ts']);
        expect(config.mappings[1]?.include).toEqual(['src/dto/**/*.ts']);
        expect(config.mappings[2]?.include).toEqual(['src/entities/**/*.ts']);
      });

      test('should support negative patterns in include', async () => {
        const configPath = await createConfigFile(
          'negative-patterns.json',
          JSON.stringify({
            mappings: [
              {
                include: ['src/**/*.ts', '!src/draft/**', '!src/internal/**'],
                output: { pattern: 'schemas/{filename}.schema.ts' },
              },
            ],
            generator: 'typebox',
          }),
        );

        const loader = new ConfigLoader(configPath);
        const config = await loader.load();

        expect(config.mappings[0]?.include).toEqual(['src/**/*.ts', '!src/draft/**', '!src/internal/**']);
      });

      test('should support all generators', async () => {
        const generators = ['typebox', 'elysia'] as const;

        for (const generator of generators) {
          const configPath = await createConfigFile(
            `generator-${generator}.json`,
            JSON.stringify({
              mappings: [
                {
                  include: ['src/**/*.ts'],
                  output: { pattern: 'schemas/{filename}.schema.ts' },
                },
              ],
              generator,
            }),
          );

          const loader = new ConfigLoader(configPath);
          const config = await loader.load();

          expect(config.generator).toBe(generator);
        }
      });

      test('should support all modes', async () => {
        const modes = ['separate', 'inline'] as const;

        for (const mode of modes) {
          const configPath = await createConfigFile(
            `mode-${mode}.json`,
            JSON.stringify({
              mappings: [
                {
                  include: ['src/**/*.ts'],
                  output: { pattern: 'schemas/{filename}.schema.ts' },
                },
              ],
              generator: 'typebox',
              mode,
            }),
          );

          const loader = new ConfigLoader(configPath);
          const config = await loader.load();

          expect(config.mode).toBe(mode);
        }
      });

      test('should work without optional mode field', async () => {
        const configPath = await createConfigFile(
          'no-mode.json',
          JSON.stringify({
            mappings: [
              {
                include: ['src/**/*.ts'],
                output: { pattern: 'schemas/{filename}.schema.ts' },
              },
            ],
            generator: 'typebox',
          }),
        );

        const loader = new ConfigLoader(configPath);
        const config = await loader.load();

        expect(config.mode).toBeUndefined();
      });

      test('should work without optional exclude field', async () => {
        const configPath = await createConfigFile(
          'no-exclude.json',
          JSON.stringify({
            mappings: [
              {
                include: ['src/**/*.ts'],
                output: { pattern: 'schemas/{filename}.schema.ts' },
              },
            ],
            generator: 'typebox',
          }),
        );

        const loader = new ConfigLoader(configPath);
        const config = await loader.load();

        expect(config.exclude).toBeUndefined();
      });

      test('should support multiple include patterns in single mapping', async () => {
        const configPath = await createConfigFile(
          'multiple-includes.json',
          JSON.stringify({
            mappings: [
              {
                include: ['src/models/**/*.ts', 'src/entities/**/*.ts', 'src/domain/**/*.ts'],
                output: { pattern: 'schemas/{filename}.schema.ts' },
              },
            ],
            generator: 'typebox',
          }),
        );

        const loader = new ConfigLoader(configPath);
        const config = await loader.load();

        expect(config.mappings[0]?.include).toHaveLength(3);
      });

      test('should support multiple exclude patterns', async () => {
        const configPath = await createConfigFile(
          'multiple-excludes.json',
          JSON.stringify({
            mappings: [
              {
                include: ['src/**/*.ts'],
                output: { pattern: 'schemas/{filename}.schema.ts' },
              },
            ],
            generator: 'typebox',
            exclude: ['**/*.test.ts', '**/*.spec.ts', '**/*.d.ts', '**/node_modules/**'],
          }),
        );

        const loader = new ConfigLoader(configPath);
        const config = await loader.load();

        expect(config.exclude).toHaveLength(4);
      });
    });

    describe('error cases', () => {
      test('should throw ConfigNotFoundError when file does not exist', async () => {
        const loader = new ConfigLoader(join(TEST_DIR, 'non-existent.json'));

        await expect(loader.load()).rejects.toThrow(ConfigNotFoundError);
      });

      test('should throw ConfigParseError for invalid JSON', async () => {
        const configPath = await createConfigFile('invalid.json', '{ "mappings": [ }');

        const loader = new ConfigLoader(configPath);

        await expect(loader.load()).rejects.toThrow(ConfigParseError);
      });

      test('should throw ConfigParseError for malformed JSON', async () => {
        const configPath = await createConfigFile('malformed.json', '{invalid json}');

        const loader = new ConfigLoader(configPath);

        await expect(loader.load()).rejects.toThrow(ConfigParseError);
      });

      test('should throw ConfigValidationError when config is not an object', async () => {
        const configPath = await createConfigFile('not-object.json', JSON.stringify('string'));

        const loader = new ConfigLoader(configPath);

        await expect(loader.load()).rejects.toThrow(ConfigValidationError);
        await expect(loader.load()).rejects.toThrow('Config must be an object');
      });

      test('should throw ConfigValidationError when config is null', async () => {
        const configPath = await createConfigFile('null.json', 'null');

        const loader = new ConfigLoader(configPath);

        await expect(loader.load()).rejects.toThrow(ConfigValidationError);
        await expect(loader.load()).rejects.toThrow('Config must be an object');
      });

      test('should throw ConfigValidationError when config is array', async () => {
        const configPath = await createConfigFile('array.json', '[]');

        const loader = new ConfigLoader(configPath);

        await expect(loader.load()).rejects.toThrow(ConfigValidationError);
        await expect(loader.load()).rejects.toThrow('Config must be an object');
      });
    });

    describe('validate - mappings errors', () => {
      test('should throw when mappings is missing', async () => {
        const configPath = await createConfigFile(
          'no-mappings.json',
          JSON.stringify({
            generator: 'typebox',
          }),
        );

        const loader = new ConfigLoader(configPath);

        await expect(loader.load()).rejects.toThrow(ConfigValidationError);
        await expect(loader.load()).rejects.toThrow('Config must have "mappings" array');
      });

      test('should throw when mappings is not an array', async () => {
        const configPath = await createConfigFile(
          'mappings-not-array.json',
          JSON.stringify({
            mappings: 'not-an-array',
            generator: 'typebox',
          }),
        );

        const loader = new ConfigLoader(configPath);

        await expect(loader.load()).rejects.toThrow(ConfigValidationError);
        await expect(loader.load()).rejects.toThrow('Config must have "mappings" array');
      });

      test('should throw when mappings is empty array', async () => {
        const configPath = await createConfigFile(
          'empty-mappings.json',
          JSON.stringify({
            mappings: [],
            generator: 'typebox',
          }),
        );

        const loader = new ConfigLoader(configPath);

        await expect(loader.load()).rejects.toThrow(ConfigValidationError);
        await expect(loader.load()).rejects.toThrow('At least one mapping rule is required');
      });

      test('should throw when mapping is not an object', async () => {
        const configPath = await createConfigFile(
          'mapping-not-object.json',
          JSON.stringify({
            mappings: ['not-an-object'],
            generator: 'typebox',
          }),
        );

        const loader = new ConfigLoader(configPath);

        await expect(loader.load()).rejects.toThrow(ConfigValidationError);
        await expect(loader.load()).rejects.toThrow('Mapping rule 1: Must be an object');
      });

      test('should throw when mapping is null', async () => {
        const configPath = await createConfigFile(
          'mapping-null.json',
          JSON.stringify({
            mappings: [null],
            generator: 'typebox',
          }),
        );

        const loader = new ConfigLoader(configPath);

        await expect(loader.load()).rejects.toThrow(ConfigValidationError);
        await expect(loader.load()).rejects.toThrow('Mapping rule 1: Must be an object');
      });

      test('should throw when include is missing', async () => {
        const configPath = await createConfigFile(
          'no-include.json',
          JSON.stringify({
            mappings: [
              {
                output: { pattern: 'schemas/{filename}.schema.ts' },
              },
            ],
            generator: 'typebox',
          }),
        );

        const loader = new ConfigLoader(configPath);

        await expect(loader.load()).rejects.toThrow(ConfigValidationError);
        await expect(loader.load()).rejects.toThrow(
          'Mapping rule 1: Must have "include" array with at least one pattern',
        );
      });

      test('should throw when include is not an array', async () => {
        const configPath = await createConfigFile(
          'include-not-array.json',
          JSON.stringify({
            mappings: [
              {
                include: 'not-an-array',
                output: { pattern: 'schemas/{filename}.schema.ts' },
              },
            ],
            generator: 'typebox',
          }),
        );

        const loader = new ConfigLoader(configPath);

        await expect(loader.load()).rejects.toThrow(ConfigValidationError);
        await expect(loader.load()).rejects.toThrow(
          'Mapping rule 1: Must have "include" array with at least one pattern',
        );
      });

      test('should throw when include is empty array', async () => {
        const configPath = await createConfigFile(
          'empty-include.json',
          JSON.stringify({
            mappings: [
              {
                include: [],
                output: { pattern: 'schemas/{filename}.schema.ts' },
              },
            ],
            generator: 'typebox',
          }),
        );

        const loader = new ConfigLoader(configPath);

        await expect(loader.load()).rejects.toThrow(ConfigValidationError);
        await expect(loader.load()).rejects.toThrow(
          'Mapping rule 1: Must have "include" array with at least one pattern',
        );
      });

      test('should throw when include has empty string', async () => {
        const configPath = await createConfigFile(
          'include-empty-string.json',
          JSON.stringify({
            mappings: [
              {
                include: [''],
                output: { pattern: 'schemas/{filename}.schema.ts' },
              },
            ],
            generator: 'typebox',
          }),
        );

        const loader = new ConfigLoader(configPath);

        await expect(loader.load()).rejects.toThrow(ConfigValidationError);
        await expect(loader.load()).rejects.toThrow('Mapping rule 1: All "include" patterns must be non-empty strings');
      });

      test('should throw when include has whitespace-only string', async () => {
        const configPath = await createConfigFile(
          'include-whitespace.json',
          JSON.stringify({
            mappings: [
              {
                include: ['   '],
                output: { pattern: 'schemas/{filename}.schema.ts' },
              },
            ],
            generator: 'typebox',
          }),
        );

        const loader = new ConfigLoader(configPath);

        await expect(loader.load()).rejects.toThrow(ConfigValidationError);
        await expect(loader.load()).rejects.toThrow('Mapping rule 1: All "include" patterns must be non-empty strings');
      });

      test('should throw when include has non-string value', async () => {
        const configPath = await createConfigFile(
          'include-non-string.json',
          JSON.stringify({
            mappings: [
              {
                include: [123],
                output: { pattern: 'schemas/{filename}.schema.ts' },
              },
            ],
            generator: 'typebox',
          }),
        );

        const loader = new ConfigLoader(configPath);

        await expect(loader.load()).rejects.toThrow(ConfigValidationError);
        await expect(loader.load()).rejects.toThrow('Mapping rule 1: All "include" patterns must be non-empty strings');
      });

      test('should throw when output is missing', async () => {
        const configPath = await createConfigFile(
          'no-output.json',
          JSON.stringify({
            mappings: [
              {
                include: ['src/**/*.ts'],
              },
            ],
            generator: 'typebox',
          }),
        );

        const loader = new ConfigLoader(configPath);

        await expect(loader.load()).rejects.toThrow(ConfigValidationError);
        await expect(loader.load()).rejects.toThrow('Mapping rule 1: Must have "output" object');
      });

      test('should throw when output is not an object', async () => {
        const configPath = await createConfigFile(
          'output-not-object.json',
          JSON.stringify({
            mappings: [
              {
                include: ['src/**/*.ts'],
                output: 'not-an-object',
              },
            ],
            generator: 'typebox',
          }),
        );

        const loader = new ConfigLoader(configPath);

        await expect(loader.load()).rejects.toThrow(ConfigValidationError);
        await expect(loader.load()).rejects.toThrow('Mapping rule 1: Must have "output" object');
      });

      test('should throw when output.pattern is missing', async () => {
        const configPath = await createConfigFile(
          'no-pattern.json',
          JSON.stringify({
            mappings: [
              {
                include: ['src/**/*.ts'],
                output: {},
              },
            ],
            generator: 'typebox',
          }),
        );

        const loader = new ConfigLoader(configPath);

        await expect(loader.load()).rejects.toThrow(ConfigValidationError);
        await expect(loader.load()).rejects.toThrow('Mapping rule 1: "output.pattern" must be a non-empty string');
      });

      test('should throw when output.pattern is empty string', async () => {
        const configPath = await createConfigFile(
          'pattern-empty.json',
          JSON.stringify({
            mappings: [
              {
                include: ['src/**/*.ts'],
                output: { pattern: '' },
              },
            ],
            generator: 'typebox',
          }),
        );

        const loader = new ConfigLoader(configPath);

        await expect(loader.load()).rejects.toThrow(ConfigValidationError);
        await expect(loader.load()).rejects.toThrow('Mapping rule 1: "output.pattern" must be a non-empty string');
      });

      test('should throw when output.pattern is whitespace-only', async () => {
        const configPath = await createConfigFile(
          'pattern-whitespace.json',
          JSON.stringify({
            mappings: [
              {
                include: ['src/**/*.ts'],
                output: { pattern: '   ' },
              },
            ],
            generator: 'typebox',
          }),
        );

        const loader = new ConfigLoader(configPath);

        await expect(loader.load()).rejects.toThrow(ConfigValidationError);
        await expect(loader.load()).rejects.toThrow('Mapping rule 1: "output.pattern" must be a non-empty string');
      });

      test('should show correct mapping number in error (1-indexed)', async () => {
        const configPath = await createConfigFile(
          'multiple-mapping-error.json',
          JSON.stringify({
            mappings: [
              {
                include: ['src/**/*.ts'],
                output: { pattern: 'schemas/{filename}.schema.ts' },
              },
              {
                include: ['src/dto/**/*.ts'],
                output: { pattern: 'schemas/{filename}.schema.ts' },
              },
              {
                include: [],
                output: { pattern: 'schemas/{filename}.schema.ts' },
              },
            ],
            generator: 'typebox',
          }),
        );

        const loader = new ConfigLoader(configPath);

        await expect(loader.load()).rejects.toThrow(ConfigValidationError);
        await expect(loader.load()).rejects.toThrow('Mapping rule 3:');
      });
    });

    describe('validate - generator errors', () => {
      test('should throw when generator is missing', async () => {
        const configPath = await createConfigFile(
          'no-generator.json',
          JSON.stringify({
            mappings: [
              {
                include: ['src/**/*.ts'],
                output: { pattern: 'schemas/{filename}.schema.ts' },
              },
            ],
          }),
        );

        const loader = new ConfigLoader(configPath);

        await expect(loader.load()).rejects.toThrow(ConfigValidationError);
        await expect(loader.load()).rejects.toThrow('Config must have "generator" field');
      });

      test('should throw when generator is unsupported', async () => {
        const configPath = await createConfigFile(
          'invalid-generator.json',
          JSON.stringify({
            mappings: [
              {
                include: ['src/**/*.ts'],
                output: { pattern: 'schemas/{filename}.schema.ts' },
              },
            ],
            generator: 'joi',
          }),
        );

        const loader = new ConfigLoader(configPath);

        await expect(loader.load()).rejects.toThrow(ConfigValidationError);
        await expect(loader.load()).rejects.toThrow('Unsupported generator: "joi"');
        await expect(loader.load()).rejects.toThrow('Must be one of:');
      });
    });

    describe('validate - mode errors', () => {
      test('should throw when mode is unsupported', async () => {
        const configPath = await createConfigFile(
          'invalid-mode.json',
          JSON.stringify({
            mappings: [
              {
                include: ['src/**/*.ts'],
                output: { pattern: 'schemas/{filename}.schema.ts' },
              },
            ],
            generator: 'typebox',
            mode: 'hybrid',
          }),
        );

        const loader = new ConfigLoader(configPath);

        await expect(loader.load()).rejects.toThrow(ConfigValidationError);
        await expect(loader.load()).rejects.toThrow('Unsupported mode: "hybrid"');
        await expect(loader.load()).rejects.toThrow('Must be one of:');
      });
    });

    describe('validate - exclude errors', () => {
      test('should throw when exclude is not an array', async () => {
        const configPath = await createConfigFile(
          'exclude-not-array.json',
          JSON.stringify({
            mappings: [
              {
                include: ['src/**/*.ts'],
                output: { pattern: 'schemas/{filename}.schema.ts' },
              },
            ],
            generator: 'typebox',
            exclude: 'not-an-array',
          }),
        );

        const loader = new ConfigLoader(configPath);

        await expect(loader.load()).rejects.toThrow(ConfigValidationError);
        await expect(loader.load()).rejects.toThrow('Config must have "exclude" array');
      });

      test('should throw when exclude has empty string', async () => {
        const configPath = await createConfigFile(
          'exclude-empty-string.json',
          JSON.stringify({
            mappings: [
              {
                include: ['src/**/*.ts'],
                output: { pattern: 'schemas/{filename}.schema.ts' },
              },
            ],
            generator: 'typebox',
            exclude: [''],
          }),
        );

        const loader = new ConfigLoader(configPath);

        await expect(loader.load()).rejects.toThrow(ConfigValidationError);
        await expect(loader.load()).rejects.toThrow('All "exclude" patterns must be non-empty strings');
      });

      test('should throw when exclude has whitespace-only string', async () => {
        const configPath = await createConfigFile(
          'exclude-whitespace.json',
          JSON.stringify({
            mappings: [
              {
                include: ['src/**/*.ts'],
                output: { pattern: 'schemas/{filename}.schema.ts' },
              },
            ],
            generator: 'typebox',
            exclude: ['   '],
          }),
        );

        const loader = new ConfigLoader(configPath);

        await expect(loader.load()).rejects.toThrow(ConfigValidationError);
        await expect(loader.load()).rejects.toThrow('All "exclude" patterns must be non-empty strings');
      });

      test('should throw when exclude has non-string value', async () => {
        const configPath = await createConfigFile(
          'exclude-non-string.json',
          JSON.stringify({
            mappings: [
              {
                include: ['src/**/*.ts'],
                output: { pattern: 'schemas/{filename}.schema.ts' },
              },
            ],
            generator: 'typebox',
            exclude: [123],
          }),
        );

        const loader = new ConfigLoader(configPath);

        await expect(loader.load()).rejects.toThrow(ConfigValidationError);
        await expect(loader.load()).rejects.toThrow('All "exclude" patterns must be non-empty strings');
      });
    });

    describe('error messages', () => {
      test('ConfigNotFoundError should have helpful message', async () => {
        const loader = new ConfigLoader(join(TEST_DIR, 'missing.json'));

        try {
          await loader.load();
          expect.unreachable('Should have thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(ConfigNotFoundError);
          expect((error as Error).message).toContain('Config file not found');
          expect((error as Error).message).toContain('schema-gen init');
        }
      });

      test('ConfigParseError should include file path and error', async () => {
        const configPath = await createConfigFile('bad.json', '{invalid}');
        const loader = new ConfigLoader(configPath);

        try {
          await loader.load();
          expect.unreachable('Should have thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(ConfigParseError);
          expect((error as Error).message).toContain(configPath);
          expect((error as Error).message).toContain('Invalid JSON');
        }
      });
    });
  });
});
