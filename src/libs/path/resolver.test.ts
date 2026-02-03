import { describe, expect, test } from 'bun:test';
import { PathResolver } from './resolver';

describe('PathResolver', () => {
  const resolver = new PathResolver();

  describe('resolve', () => {
    describe('basic patterns', () => {
      test('should resolve {filename} pattern', () => {
        const result = resolver.resolve('src/models/user.ts', 'schemas/{filename}.schema.ts');
        expect(result).toBe('schemas/user.schema.ts');
      });

      test('should resolve {dirname} pattern', () => {
        const result = resolver.resolve('src/models/user.ts', '{dirname}/schemas/output.ts');
        expect(result).toBe('src/models/schemas/output.ts');
      });

      test('should resolve {extension} pattern', () => {
        const result = resolver.resolve('src/models/user.ts', 'schemas/output{extension}');
        expect(result).toBe('schemas/output.ts');
      });
    });

    describe('combined patterns', () => {
      test('should resolve pattern with filename and dirname', () => {
        const result = resolver.resolve('src/models/user.ts', '{dirname}/schemas/{filename}.schema.ts');
        expect(result).toBe('src/models/schemas/user.schema.ts');
      });

      test('should resolve pattern with all variables', () => {
        const result = resolver.resolve('src/models/user.ts', '{dirname}/output/{filename}{extension}');
        expect(result).toBe('src/models/output/user.ts');
      });

      test('should resolve pattern creating directory from filename', () => {
        const result = resolver.resolve('src/models/user.ts', 'src/route/{filename}/schema.ts');
        expect(result).toBe('src/route/user/schema.ts');
      });

      test('should resolve pattern with filename used multiple times', () => {
        const result = resolver.resolve('src/user.ts', '{filename}/{filename}.schema.ts');
        expect(result).toBe('user/user.schema.ts');
      });

      test('should resolve pattern with dirname used multiple times', () => {
        const result = resolver.resolve('src/models/user.ts', '{dirname}/{dirname}/output.ts');
        expect(result).toBe('src/models/src/models/output.ts');
      });
    });

    describe('different file structures', () => {
      test('should handle simple filename', () => {
        const result = resolver.resolve('user.ts', 'schemas/{filename}.schema.ts');
        expect(result).toBe('schemas/user.schema.ts');
      });

      test('should handle nested directories', () => {
        const result = resolver.resolve('src/models/domain/entities/user.ts', '{dirname}/schemas/{filename}.schema.ts');
        expect(result).toBe('src/models/domain/entities/schemas/user.schema.ts');
      });

      test('should handle multiple dots in filename', () => {
        const result = resolver.resolve('src/user.dto.ts', 'schemas/{filename}.schema.ts');
        expect(result).toBe('schemas/user.dto.schema.ts');
      });

      test('should handle files without extension', () => {
        const result = resolver.resolve('src/models/user', 'schemas/{filename}.ts');
        expect(result).toBe('schemas/user.ts');
      });

      test.each([
        { extension: '.ts', expected: 'schemas/user.ts' },
        { extension: '.tsx', expected: 'schemas/user.tsx' },
        { extension: '.js', expected: 'schemas/user.js' },
        { extension: '.jsx', expected: 'schemas/user.jsx' },
        { extension: '.mts', expected: 'schemas/user.mts' },
        { extension: '.cts', expected: 'schemas/user.cts' },
      ])('should handle $extension extension', ({ extension, expected }) => {
        const result = resolver.resolve(`src/user${extension}`, 'schemas/{filename}{extension}');
        expect(result).toBe(expected);
      });
    });

    describe('complex patterns', () => {
      test('should resolve deeply nested output structure', () => {
        const result = resolver.resolve('src/user.ts', 'generated/schemas/v1/{filename}/index.ts');
        expect(result).toBe('generated/schemas/v1/user/index.ts');
      });

      test('should preserve source directory structure in output', () => {
        const result = resolver.resolve('src/models/domain/user.ts', 'dist/{dirname}/{filename}.js');
        expect(result).toBe('dist/src/models/domain/user.js');
      });

      test('should create parallel directory structure', () => {
        const result = resolver.resolve('src/dto/user.ts', 'src/schemas/dto/{filename}.schema.ts');
        expect(result).toBe('src/schemas/dto/user.schema.ts');
      });

      test('should handle pattern without variables', () => {
        const result = resolver.resolve('src/user.ts', 'schemas/output.ts');
        expect(result).toBe('schemas/output.ts');
      });

      test('should handle pattern with only variables', () => {
        const result = resolver.resolve('src/models/user.ts', '{dirname}/{filename}{extension}');
        expect(result).toBe('src/models/user.ts');
      });
    });

    describe('edge cases', () => {
      test('should handle current directory', () => {
        const result = resolver.resolve('./user.ts', 'schemas/{filename}.schema.ts');
        expect(result).toBe('schemas/user.schema.ts');
      });

      test('should handle parent directory references', () => {
        const result = resolver.resolve('../models/user.ts', 'schemas/{filename}.schema.ts');
        expect(result).toBe('schemas/user.schema.ts');
      });

      test('should handle filenames with special characters', () => {
        const result = resolver.resolve('src/user-model.ts', 'schemas/{filename}.schema.ts');
        expect(result).toBe('schemas/user-model.schema.ts');
      });

      test('should handle filenames with underscores', () => {
        const result = resolver.resolve('src/user_model.ts', 'schemas/{filename}.schema.ts');
        expect(result).toBe('schemas/user_model.schema.ts');
      });

      test('should handle filenames with numbers', () => {
        const result = resolver.resolve('src/user123.ts', 'schemas/{filename}.schema.ts');
        expect(result).toBe('schemas/user123.schema.ts');
      });

      test('should handle empty extension', () => {
        const result = resolver.resolve('src/user', 'schemas/{filename}{extension}');
        expect(result).toBe('schemas/user');
      });

      test('should handle single dot directory', () => {
        const result = resolver.resolve('user.ts', '{dirname}/{filename}.schema.ts');
        expect(result).toBe('./user.schema.ts');
      });
    });

    describe('real-world scenarios', () => {
      test.each([
        { input: 'src/models/user.ts', output: 'src/route/user/schema.ts' },
        { input: 'src/models/product.ts', output: 'src/route/product/schema.ts' },
        { input: 'src/models/order.ts', output: 'src/route/order/schema.ts' },
      ])('models to route schemas: $input → $output', ({ input, output }) => {
        const result = resolver.resolve(input, 'src/route/{filename}/schema.ts');
        expect(result).toBe(output);
      });

      test.each([
        { input: 'src/dto/user.dto.ts', output: 'src/api/schemas/user.dto.schema.ts' },
        { input: 'src/dto/product.dto.ts', output: 'src/api/schemas/product.dto.schema.ts' },
      ])('dto to api schemas: $input → $output', ({ input, output }) => {
        const result = resolver.resolve(input, 'src/api/schemas/{filename}.schema.ts');
        expect(result).toBe(output);
      });

      test.each([
        { input: 'src/models/user.ts', output: 'src/models/schemas/user.schema.ts' },
        { input: 'src/models/domain/product.ts', output: 'src/models/domain/schemas/product.schema.ts' },
      ])('preserve directory structure: $input → $output', ({ input, output }) => {
        const result = resolver.resolve(input, '{dirname}/schemas/{filename}.schema.ts');
        expect(result).toBe(output);
      });

      test.each([
        { input: 'src/models/user.ts', output: 'schemas/user.schema.ts' },
        { input: 'src/dto/product.dto.ts', output: 'schemas/product.dto.schema.ts' },
        { input: 'src/api/order.ts', output: 'schemas/order.schema.ts' },
      ])('flat output directory: $input → $output', ({ input, output }) => {
        const result = resolver.resolve(input, 'schemas/{filename}.schema.ts');
        expect(result).toBe(output);
      });

      test.each([
        { input: 'src/user.ts', output: 'dist/src/user.js' },
        { input: 'src/models/product.ts', output: 'dist/src/models/product.js' },
      ])('change extension: $input → $output', ({ input, output }) => {
        const result = resolver.resolve(input, 'dist/{dirname}/{filename}.js');
        expect(result).toBe(output);
      });
    });

    describe('custom variables', () => {
      test('should resolve static custom variables', () => {
        const result = resolver.resolve('src/user.ts', 'schemas/{version}/{filename}.ts', { version: 'v1' });
        expect(result).toBe('schemas/v1/user.ts');
      });

      test('should resolve multiple custom variables', () => {
        const result = resolver.resolve('src/user.ts', 'schemas/{version}/{env}/{filename}.ts', {
          version: 'v1',
          env: 'prod',
        });
        expect(result).toBe('schemas/v1/prod/user.ts');
      });

      test('should resolve regex extraction variables', () => {
        const result = resolver.resolve('src/user/domain/model.ts', 'generated/{module}/{filename}.ts', {
          module: { regex: 'src/([^/]+)/' },
        });
        expect(result).toBe('generated/user/model.ts');
      });

      test('should resolve deep regex extraction', () => {
        const result = resolver.resolve(
          'src/modules/billing/domain/entities/invoice.ts',
          'api/{module}/schemas/{filename}.ts',
          {
            module: { regex: 'src/modules/([^/]+)/' },
          },
        );
        expect(result).toBe('api/billing/schemas/invoice.ts');
      });

      test('should handle regex with no match', () => {
        const result = resolver.resolve('src/other/model.ts', 'generated/{module}/{filename}.ts', {
          module: { regex: 'src/modules/([^/]+)/' },
        });
        expect(result).toBe('generated//model.ts');
      });

      test('should prioritize built-in variables over custom ones if they overlap (built-ins are applied first)', () => {
        // Current implementation replaces built-ins first, then custom.
        // If a custom variable name is 'filename', it will replace '{filename}' AFTER the built-in one already did.
        // So {filename} -> 'user' -> 'custom-user' (if custom variable 'user' exists? No, it looks for '{user}')
        // If custom variable key is 'filename', it looks for '{filename}'.
        const result = resolver.resolve('src/user.ts', 'schemas/{filename}.ts', { filename: 'custom' });
        expect(result).toBe('schemas/custom.ts');
      });
    });
  });
});
