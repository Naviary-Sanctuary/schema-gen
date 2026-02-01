import { describe, expect, test } from 'bun:test';
import type { ParsedClass } from '@types';
import { TypeBoxGenerator } from './type-box-generator';

describe('TypeBoxGenerator Test', () => {
  const generator = new TypeBoxGenerator('elysia');

  describe('supports Test', () => {
    test('should support typebox', () => {
      expect(generator.supports('typebox')).toBe(true);
    });

    test('should not support other types', () => {
      expect(generator.supports('zod')).toBe(false);
      expect(generator.supports('yup')).toBe(false);
      expect(generator.supports('class-validator')).toBe(false);
    });
  });

  describe('getImports Test', () => {
    test('should return elysia typeBox import statement', () => {
      expect(generator.getImports()).toEqual(['import { t } from "elysia"']);
    });
  });

  describe('generate Test', () => {
    describe('schema name', () => {
      test('should convert PascalCase to camelCase with schema suffix', () => {
        const parsedClass: ParsedClass = {
          name: 'UserResponse',
          filePath: 'test.ts',
          isExported: true,
          properties: [],
        };

        const result = generator.generate(parsedClass);

        expect(result).toContain('userResponseSchema');
      });
    });

    describe('Primitive types', () => {
      test('should generate string type', () => {
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
          ],
        };

        const result = generator.generate(parsedClass);
        expect(result).toContain('t.String()');
      });

      test('should generate number type', () => {
        const parsedClass: ParsedClass = {
          name: 'User',
          filePath: 'test.ts',
          isExported: true,
          properties: [
            {
              name: 'age',
              type: { kind: 'primitive', type: 'number' },
              isOptional: false,
              isReadonly: false,
              hasDefaultValue: false,
            },
          ],
        };

        const result = generator.generate(parsedClass);
        expect(result).toContain('t.Number()');
      });

      test('should generate boolean type', () => {
        const parsedClass: ParsedClass = {
          name: 'User',
          filePath: 'test.ts',
          isExported: true,
          properties: [
            {
              name: 'isActive',
              type: { kind: 'primitive', type: 'boolean' },
              isOptional: false,
              isReadonly: false,
              hasDefaultValue: false,
            },
          ],
        };

        const result = generator.generate(parsedClass);
        expect(result).toContain('t.Boolean()');
      });

      test('should generate Date type', () => {
        const parsedClass: ParsedClass = {
          name: 'User',
          filePath: 'test.ts',
          isExported: true,
          properties: [
            {
              name: 'createdAt',
              type: { kind: 'primitive', type: 'Date' },
              isOptional: false,
              isReadonly: false,
              hasDefaultValue: false,
            },
          ],
        };

        const result = generator.generate(parsedClass);
        expect(result).toContain('t.Date()');
      });
    });

    describe('optional properties', () => {
      test('should wrap optional properties in t.Optional()', () => {
        const parsedClass: ParsedClass = {
          name: 'User',
          filePath: 'test.ts',
          isExported: true,
          properties: [
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
        expect(result).toContain('t.Optional(t.Number())');
      });

      test('should not wrap non-optional properties in t.Optional()', () => {
        const parsedClass: ParsedClass = {
          name: 'User',
          filePath: 'test.ts',
          isExported: true,
          properties: [
            {
              name: 'age',
              type: { kind: 'primitive', type: 'number' },
              isOptional: true,
              isReadonly: false,
              hasDefaultValue: false,
            },
            {
              name: 'id',
              type: { kind: 'primitive', type: 'string' },
              isOptional: false,
              isReadonly: false,
              hasDefaultValue: false,
            },
          ],
        };

        const result = generator.generate(parsedClass);
        expect(result).toContain('age: t.Optional(t.Number())');
        expect(result).toContain('id: t.String()');
      });
    });
    describe('array types', () => {
      test('should generate string array', () => {
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
          ],
        };

        const result = generator.generate(parsedClass);
        expect(result).toContain('t.Array(t.String())');
      });

      test('should generate number array', () => {
        const parsedClass: ParsedClass = {
          name: 'User',
          filePath: 'test.ts',
          isExported: true,
          properties: [
            {
              name: 'scores',
              type: { kind: 'array', elementType: { kind: 'primitive', type: 'number' } },
              isOptional: false,
              isReadonly: false,
              hasDefaultValue: false,
            },
          ],
        };

        const result = generator.generate(parsedClass);
        expect(result).toContain('t.Array(t.Number())');
      });

      test('should generate nested array', () => {
        const parsedClass: ParsedClass = {
          name: 'User',
          filePath: 'test.ts',
          isExported: true,
          properties: [
            {
              name: 'matrix',
              type: {
                kind: 'array',
                elementType: { kind: 'array', elementType: { kind: 'primitive', type: 'number' } },
              },
              isOptional: false,
              isReadonly: false,
              hasDefaultValue: false,
            },
          ],
        };

        const result = generator.generate(parsedClass);
        expect(result).toContain('t.Array(t.Array(t.Number()))');
      });
    });

    describe('object types', () => {
      test('should generate nested object', () => {
        const parsedClass: ParsedClass = {
          name: 'User',
          filePath: 'test.ts',
          isExported: true,
          properties: [
            {
              name: 'address',
              type: {
                kind: 'object',
                properties: [
                  {
                    name: 'street',
                    type: { kind: 'primitive', type: 'string' },
                    isOptional: false,
                    isReadonly: false,
                    hasDefaultValue: false,
                  },
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
        expect(result).toContain(
          't.Object({ \n  address: t.Object({\n  street: t.String(),\n  city: t.String()\n}) })',
        );
      });
    });

    describe('union types', () => {
      test('should generate UnionEnum for string literal union', () => {
        const parsedClass: ParsedClass = {
          name: 'Test',
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
                  { kind: 'literal', value: 'pending' },
                ],
              },
              isOptional: false,
              isReadonly: false,
              hasDefaultValue: false,
            },
          ],
        };

        const result = generator.generate(parsedClass);
        expect(result).toContain("status: t.UnionEnum(['active', 'inactive', 'pending'])");
      });

      test('should generate UnionEnum for number literal union', () => {
        const parsedClass: ParsedClass = {
          name: 'Test',
          filePath: 'test.ts',
          isExported: true,
          properties: [
            {
              name: 'priority',
              type: {
                kind: 'union',
                types: [
                  { kind: 'literal', value: 1 },
                  { kind: 'literal', value: 2 },
                  { kind: 'literal', value: 3 },
                ],
              },
              isOptional: false,
              isReadonly: false,
              hasDefaultValue: false,
            },
          ],
        };

        const result = generator.generate(parsedClass);
        expect(result).toContain('priority: t.UnionEnum([1, 2, 3])');
      });

      test('should generate regular Union for mixed literal types', () => {
        const parsedClass: ParsedClass = {
          name: 'Test',
          filePath: 'test.ts',
          isExported: true,
          properties: [
            {
              name: 'value',
              type: {
                kind: 'union',
                types: [
                  { kind: 'literal', value: 'text' },
                  { kind: 'literal', value: 123 },
                ],
              },
              isOptional: false,
              isReadonly: false,
              hasDefaultValue: false,
            },
          ],
        };

        const result = generator.generate(parsedClass);
        expect(result).toContain("value: t.Union([t.Literal('text'), t.Literal(123)])");
      });

      test('should generate regular Union for non-literal types', () => {
        const parsedClass: ParsedClass = {
          name: 'Test',
          filePath: 'test.ts',
          isExported: true,
          properties: [
            {
              name: 'value',
              type: {
                kind: 'union',
                types: [
                  { kind: 'primitive', type: 'string' },
                  { kind: 'primitive', type: 'number' },
                ],
              },
              isOptional: false,
              isReadonly: false,
              hasDefaultValue: false,
            },
          ],
        };

        const result = generator.generate(parsedClass);
        expect(result).toContain('value: t.Union([t.String(), t.Number()])');
      });

      test('should generate regular Union when mixing literals and non-literals', () => {
        const parsedClass: ParsedClass = {
          name: 'Test',
          filePath: 'test.ts',
          isExported: true,
          properties: [
            {
              name: 'value',
              type: {
                kind: 'union',
                types: [
                  { kind: 'literal', value: 'fixed' },
                  { kind: 'primitive', type: 'string' },
                ],
              },
              isOptional: false,
              isReadonly: false,
              hasDefaultValue: false,
            },
          ],
        };

        const result = generator.generate(parsedClass);
        expect(result).toContain("value: t.Union([t.Literal('fixed'), t.String()])");
      });
    });

    describe('literal types', () => {
      test('should generate string literal type', () => {
        const parsedClass: ParsedClass = {
          name: 'User',
          filePath: 'test.ts',
          isExported: true,
          properties: [
            {
              name: 'status',
              type: { kind: 'literal', value: 'active' },
              isOptional: false,
              isReadonly: false,
              hasDefaultValue: false,
            },
          ],
        };

        const result = generator.generate(parsedClass);
        expect(result).toContain("t.Literal('active')");
      });

      test('should generate number literal type', () => {
        const parsedClass: ParsedClass = {
          name: 'User',
          filePath: 'test.ts',
          isExported: true,
          properties: [
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
        expect(result).toContain('t.Literal(1)');
      });

      test('should generate boolean literal type', () => {
        const parsedClass: ParsedClass = {
          name: 'User',
          filePath: 'test.ts',
          isExported: true,
          properties: [
            {
              name: 'isActive',
              type: { kind: 'literal', value: true },
              isOptional: false,
              isReadonly: false,
              hasDefaultValue: false,
            },
          ],
        };

        const result = generator.generate(parsedClass);
        expect(result).toContain('t.Literal(true)');
      });
    });

    describe('complete schema', () => {
      test('should generate complete schema with all features', () => {
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
              name: 'name',
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
            {
              name: 'tags',
              type: {
                kind: 'array',
                elementType: { kind: 'primitive', type: 'string' },
              },
              isOptional: false,
              isReadonly: false,
              hasDefaultValue: false,
            },
          ],
        };

        const result = generator.generate(parsedClass);
        expect(result).toEqual(`import { t } from "elysia"

export const userSchema = t.Object({ 
  id: t.String(),
  name: t.String(),
  age: t.Optional(t.Number()),
  tags: t.Array(t.String()) });`);
      });
    });
  });

  describe('record types', () => {
    test('should generate Record<string, any> type', () => {
      const parsedClass: ParsedClass = {
        name: 'EventData',
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
        ],
      };
  
      const result = generator.generate(parsedClass);
      expect(result).toContain('metadata: t.Record(t.String(), t.Any())');
    });
  
    test('should generate Record<string, string> type', () => {
      const parsedClass: ParsedClass = {
        name: 'EventData',
        filePath: 'test.ts',
        isExported: true,
        properties: [
          {
            name: 'tags',
            type: {
              kind: 'record',
              keyType: { kind: 'primitive', type: 'string' },
              valueType: { kind: 'primitive', type: 'string' },
            },
            isOptional: false,
            isReadonly: false,
            hasDefaultValue: false,
          },
        ],
      };
  
      const result = generator.generate(parsedClass);
      expect(result).toContain('tags: t.Record(t.String(), t.String())');
    });
  
    test('should generate Record<number, number> type', () => {
      const parsedClass: ParsedClass = {
        name: 'EventData',
        filePath: 'test.ts',
        isExported: true,
        properties: [
          {
            name: 'scores',
            type: {
              kind: 'record',
              keyType: { kind: 'primitive', type: 'number' },
              valueType: { kind: 'primitive', type: 'number' },
            },
            isOptional: false,
            isReadonly: false,
            hasDefaultValue: false,
          },
        ],
      };
  
      const result = generator.generate(parsedClass);
      expect(result).toContain('scores: t.Record(t.Number(), t.Number())');
    });
  
    test('should generate nested Record type', () => {
      const parsedClass: ParsedClass = {
        name: 'NestedRecord',
        filePath: 'test.ts',
        isExported: true,
        properties: [
          {
            name: 'data',
            type: {
              kind: 'record',
              keyType: { kind: 'primitive', type: 'string' },
              valueType: {
                kind: 'array',
                elementType: { kind: 'primitive', type: 'number' },
              },
            },
            isOptional: false,
            isReadonly: false,
            hasDefaultValue: false,
          },
        ],
      };
  
      const result = generator.generate(parsedClass);
      expect(result).toContain('data: t.Record(t.String(), t.Array(t.Number()))');
    });
  });
  
  describe('intersection types', () => {
    test('should generate simple intersection type', () => {
      const parsedClass: ParsedClass = {
        name: 'Test',
        filePath: 'test.ts',
        isExported: true,
        properties: [
          {
            name: 'combined',
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
      expect(result).toContain('t.Intersect([');
      expect(result).toContain('t.Object');
    });
  
    test('should generate intersection with primitive types', () => {
      const parsedClass: ParsedClass = {
        name: 'Test',
        filePath: 'test.ts',
        isExported: true,
        properties: [
          {
            name: 'value',
            type: {
              kind: 'intersection',
              types: [
                { kind: 'primitive', type: 'string' },
                {
                  kind: 'object',
                  properties: [
                    {
                      name: 'length',
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
      expect(result).toContain('value: t.Intersect([t.String(), t.Object');
    });
  
    test('should handle optional intersection type', () => {
      const parsedClass: ParsedClass = {
        name: 'Test',
        filePath: 'test.ts',
        isExported: true,
        properties: [
          {
            name: 'optional',
            type: {
              kind: 'intersection',
              types: [
                {
                  kind: 'object',
                  properties: [
                    {
                      name: 'x',
                      type: { kind: 'primitive', type: 'number' },
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
                      name: 'y',
                      type: { kind: 'primitive', type: 'number' },
                      isOptional: false,
                      isReadonly: false,
                      hasDefaultValue: false,
                    },
                  ],
                },
              ],
            },
            isOptional: true,
            isReadonly: false,
            hasDefaultValue: false,
          },
        ],
      };
  
      const result = generator.generate(parsedClass);
      expect(result).toContain('optional: t.Optional(t.Intersect([');
    });
  });
  
  describe('complex combinations', () => {
    test('should handle Record with intersection value type', () => {
      const parsedClass: ParsedClass = {
        name: 'Complex',
        filePath: 'test.ts',
        isExported: true,
        properties: [
          {
            name: 'data',
            type: {
              kind: 'record',
              keyType: { kind: 'primitive', type: 'string' },
              valueType: {
                kind: 'intersection',
                types: [
                  {
                    kind: 'object',
                    properties: [
                      {
                        name: 'id',
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
                        name: 'timestamp',
                        type: { kind: 'primitive', type: 'Date' },
                        isOptional: false,
                        isReadonly: false,
                        hasDefaultValue: false,
                      },
                    ],
                  },
                ],
              },
            },
            isOptional: false,
            isReadonly: false,
            hasDefaultValue: false,
          },
        ],
      };
  
      const result = generator.generate(parsedClass);
      expect(result).toContain('data: t.Record(t.String(), t.Intersect([');
    });
  
    test('should handle intersection with Record type', () => {
      const parsedClass: ParsedClass = {
        name: 'Complex',
        filePath: 'test.ts',
        isExported: true,
        properties: [
          {
            name: 'mixed',
            type: {
              kind: 'intersection',
              types: [
                {
                  kind: 'record',
                  keyType: { kind: 'primitive', type: 'string' },
                  valueType: { kind: 'primitive', type: 'any' },
                },
                {
                  kind: 'object',
                  properties: [
                    {
                      name: 'special',
                      type: { kind: 'primitive', type: 'string' },
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
      expect(result).toContain('mixed: t.Intersect([t.Record(t.String(), t.Any()), t.Object');
    });
  });
});

describe('TypeBoxGenerator Test', () => {
  const generator = new TypeBoxGenerator('typebox');

  describe('getImports Test', () => {
    test('should return typebox import statement', () => {
      expect(generator.getImports()).toEqual(['import { Type as t } from "@sinclair/typebox"']);
    });
  });
});
