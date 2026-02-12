import { describe, expect, test } from 'bun:test';
import type { ParsedClass } from '@types';
import { ZodGenerator } from './zod-generator';

describe('ZodGenerator Test', () => {
  const generator = new ZodGenerator();

  describe('supports Test', () => {
    test('should support zod', () => {
      expect(generator.supports('zod')).toBe(true);
    });

    test('should not support other types', () => {
      expect(generator.supports('typebox')).toBe(false);
      expect(generator.supports('elysia')).toBe(false);
      expect(generator.supports('yup')).toBe(false);
    });
  });

  describe('getImports Test', () => {
    test('should return zod import statement', () => {
      expect(generator.getImports()).toEqual(['import { z } from "zod"']);
    });
  });

  describe('generate Test', () => {
    test('should generate primitive types', () => {
      const parsedClass: ParsedClass = {
        name: 'User',
        filePath: 'test.ts',
        isExported: true,
        properties: [
          {
            name: 'id',
            type: { kind: 'primitive', type: 'string' },
            isOptional: false,
            isReadonly: false,
            hasDefaultValue: false,
          },
          {
            name: 'age',
            type: { kind: 'primitive', type: 'number' },
            isOptional: false,
            isReadonly: false,
            hasDefaultValue: false,
          },
          {
            name: 'isActive',
            type: { kind: 'primitive', type: 'boolean' },
            isOptional: false,
            isReadonly: false,
            hasDefaultValue: false,
          },
          {
            name: 'createdAt',
            type: { kind: 'primitive', type: 'Date' },
            isOptional: false,
            isReadonly: false,
            hasDefaultValue: false,
          },
          {
            name: 'nullable',
            type: { kind: 'primitive', type: 'null' },
            isOptional: false,
            isReadonly: false,
            hasDefaultValue: false,
          },
          {
            name: 'undef',
            type: { kind: 'primitive', type: 'undefined' },
            isOptional: false,
            isReadonly: false,
            hasDefaultValue: false,
          },
          {
            name: 'anything',
            type: { kind: 'primitive', type: 'any' },
            isOptional: false,
            isReadonly: false,
            hasDefaultValue: false,
          },
        ],
      };

      const result = generator.generate(parsedClass);
      expect(result).toContain('id: z.string()');
      expect(result).toContain('age: z.number()');
      expect(result).toContain('isActive: z.boolean()');
      expect(result).toContain('createdAt: z.date()');
      expect(result).toContain('nullable: z.null()');
      expect(result).toContain('undef: z.undefined()');
      expect(result).toContain('anything: z.any()');
    });

    test('should generate optional property', () => {
      const parsedClass: ParsedClass = {
        name: 'User',
        filePath: 'test.ts',
        isExported: true,
        properties: [
          {
            name: 'nickname',
            type: { kind: 'primitive', type: 'string' },
            isOptional: true,
            isReadonly: false,
            hasDefaultValue: false,
          },
        ],
      };

      const result = generator.generate(parsedClass);
      expect(result).toContain('nickname: z.string().optional()');
    });

    test('should generate array and nested object', () => {
      const parsedClass: ParsedClass = {
        name: 'User',
        filePath: 'test.ts',
        isExported: true,
        properties: [
          {
            name: 'tags',
            type: { kind: 'array', elementType: { kind: 'primitive', type: 'string' } },
            isOptional: false,
            isReadonly: false,
            hasDefaultValue: false,
          },
          {
            name: 'profile',
            type: {
              kind: 'object',
              properties: [
                {
                  name: 'city',
                  type: { kind: 'primitive', type: 'string' },
                  isOptional: false,
                  isReadonly: false,
                  hasDefaultValue: false,
                },
              ],
            },
            isOptional: false,
            isReadonly: false,
            hasDefaultValue: false,
          },
        ],
      };

      const result = generator.generate(parsedClass);
      expect(result).toContain('tags: z.array(z.string())');
      expect(result).toContain('profile: z.object({');
      expect(result).toContain('city: z.string()');
    });

    test('should generate union and literal types', () => {
      const parsedClass: ParsedClass = {
        name: 'User',
        filePath: 'test.ts',
        isExported: true,
        properties: [
          {
            name: 'status',
            type: {
              kind: 'union',
              types: [
                { kind: 'literal', value: 'active' },
                { kind: 'literal', value: 'inactive' },
              ],
            },
            isOptional: false,
            isReadonly: false,
            hasDefaultValue: false,
          },
          {
            name: 'priority',
            type: { kind: 'literal', value: 1 },
            isOptional: false,
            isReadonly: false,
            hasDefaultValue: false,
          },
        ],
      };

      const result = generator.generate(parsedClass);
      expect(result).toContain("status: z.union([z.literal('active'), z.literal('inactive')])");
      expect(result).toContain('priority: z.literal(1)');
    });

    test('should generate record and intersection types', () => {
      const parsedClass: ParsedClass = {
        name: 'Complex',
        filePath: 'test.ts',
        isExported: true,
        properties: [
          {
            name: 'metadata',
            type: {
              kind: 'record',
              keyType: { kind: 'primitive', type: 'string' },
              valueType: { kind: 'primitive', type: 'any' },
            },
            isOptional: false,
            isReadonly: false,
            hasDefaultValue: false,
          },
          {
            name: 'mixed',
            type: {
              kind: 'intersection',
              types: [
                {
                  kind: 'object',
                  properties: [
                    {
                      name: 'a',
                      type: { kind: 'primitive', type: 'string' },
                      isOptional: false,
                      isReadonly: false,
                      hasDefaultValue: false,
                    },
                  ],
                },
                {
                  kind: 'object',
                  properties: [
                    {
                      name: 'b',
                      type: { kind: 'primitive', type: 'number' },
                      isOptional: false,
                      isReadonly: false,
                      hasDefaultValue: false,
                    },
                  ],
                },
              ],
            },
            isOptional: false,
            isReadonly: false,
            hasDefaultValue: false,
          },
        ],
      };

      const result = generator.generate(parsedClass);
      expect(result).toContain('metadata: z.record(z.string(), z.any())');
      expect(result).toContain('mixed: z.intersection(z.object({');
    });

    test('should generate template literal and never types', () => {
      const parsedClass: ParsedClass = {
        name: 'Special',
        filePath: 'test.ts',
        isExported: true,
        properties: [
          {
            name: 'template',
            type: {
              kind: 'templateLiteral',
              elements: [
                { kind: 'literal', value: 'id-' },
                { kind: 'primitive', type: 'number' },
              ],
            },
            isOptional: false,
            isReadonly: false,
            hasDefaultValue: false,
          },
          {
            name: 'impossible',
            type: { kind: 'never' },
            isOptional: false,
            isReadonly: false,
            hasDefaultValue: false,
          },
        ],
      };

      const result = generator.generate(parsedClass);
      expect(result).toContain('template: z.string()');
      expect(result).toContain('impossible: z.never()');
    });

    test('should generate complete schema', () => {
      const parsedClass: ParsedClass = {
        name: 'User',
        filePath: 'test.ts',
        isExported: true,
        properties: [
          {
            name: 'id',
            type: { kind: 'primitive', type: 'string' },
            isOptional: false,
            isReadonly: false,
            hasDefaultValue: false,
          },
          {
            name: 'age',
            type: { kind: 'primitive', type: 'number' },
            isOptional: true,
            isReadonly: false,
            hasDefaultValue: false,
          },
        ],
      };

      const result = generator.generate(parsedClass);
      expect(result).toEqual(`import { z } from "zod"

export const userSchema = z.object({ 
  id: z.string(),
  age: z.number().optional() });`);
    });
  });
});
