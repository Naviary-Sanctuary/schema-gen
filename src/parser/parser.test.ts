import { test, expect, describe } from 'bun:test';
import { Parser } from './parser';
import path from 'path';

const FIXTURES_DIR = path.resolve(process.cwd(), 'tests/fixtures');

describe('Parser', () => {
  const parser = new Parser();

  describe('parse', () => {
    test('should parse simple class', () => {
      const filePath = path.join(FIXTURES_DIR, 'simple-class.ts');
      const result = parser.parseFile(filePath);

      expect(result).toHaveLength(1);
      const parsed = result[0];
      if (parsed) {
        expect(parsed.name).toBe('User');
        expect(parsed.properties).toHaveLength(5);

        expect(parsed.properties).toContainEqual({
          name: 'id',
          type: { kind: 'primitive', type: 'string' },
          isOptional: false,
          isReadonly: false,
          hasDefaultValue: false,
        });
      }
      expect.assertions(4);
    });

    test('should parse optional properties', () => {
      const filePath = path.join(FIXTURES_DIR, 'optional-properties.ts');
      const result = parser.parseFile(filePath);

      expect(result).toHaveLength(1);
      const parsed = result[0];
      if (parsed) {
        const description = parsed.properties.find((p) => p.name === 'description');
        expect(description?.isOptional).toBe(true);

        const id = parsed.properties.find((p) => p.name === 'id');
        expect(id?.isOptional).toBe(false);
      }
      expect.assertions(3);
    });

    test('should parse readonly properties', () => {
      const filePath = path.join(FIXTURES_DIR, 'readonly-properties.ts');
      const result = parser.parseFile(filePath);

      expect(result).toHaveLength(1);
      const parsed = result[0];
      if (parsed) {
        const id = parsed.properties.find((p) => p.name === 'id');
        expect(id?.isReadonly).toBe(true);

        const name = parsed.properties.find((p) => p.name === 'name');
        expect(name?.isReadonly).toBe(false);
      }
      expect.assertions(3);
    });

    test('should parse default values', () => {
      const filePath = path.join(FIXTURES_DIR, 'default-values.ts');
      const result = parser.parseFile(filePath);

      expect(result).toHaveLength(1);
      const parsed = result[0];
      if (parsed) {
        const host = parsed.properties.find((p) => p.name === 'host');
        expect(host?.hasDefaultValue).toBe(true);

        const name = parsed.properties.find((p) => p.name === 'name');
        expect(name?.hasDefaultValue).toBe(false);
      }
      expect.assertions(3);
    });

    test('should parse array properties', () => {
      const filePath = path.join(FIXTURES_DIR, 'array-properties.ts');
      const result = parser.parseFile(filePath);

      expect(result).toHaveLength(1);
      const parsed = result[0];
      if (parsed) {
        const tags = parsed.properties.find((p) => p.name === 'tags');
        expect(tags?.type).toEqual({
          kind: 'array',
          elementType: { kind: 'primitive', type: 'string' },
        });
      }
      expect.assertions(2);
    });

    test('should parse union types and literal values', () => {
      const filePath = path.join(FIXTURES_DIR, 'union-types.ts');
      const result = parser.parseFile(filePath);

      expect(result).toHaveLength(1);
      const parsed = result[0];
      if (parsed) {
        const status = parsed.properties.find((p) => p.name === 'status');
        expect(status?.type.kind).toBe('union');
        if (status?.type.kind === 'union') {
          const types = status.type.types;
          expect(types).toContainEqual({ kind: 'literal', value: 'pending' });
          expect(types).toContainEqual({ kind: 'literal', value: 'active' });
          expect(types).toContainEqual({ kind: 'literal', value: 'completed' });
        }

        const priority = parsed.properties.find((p) => p.name === 'priority');
        expect(priority?.type.kind).toBe('union');
        if (priority?.type.kind === 'union') {
          const types = priority.type.types;
          expect(types).toContainEqual({ kind: 'literal', value: 1 });
          expect(types).toContainEqual({ kind: 'literal', value: 2 });
          expect(types).toContainEqual({ kind: 'literal', value: 3 });
        }
      }
      expect.assertions(9);
    });

    test('should parse nested objects', () => {
      const filePath = path.join(FIXTURES_DIR, 'nested-object.ts');
      const result = parser.parseFile(filePath);

      expect(result).toHaveLength(1);
      const parsed = result[0];
      if (parsed) {
        const address = parsed.properties.find((p) => p.name === 'address');
        expect(address?.type.kind).toBe('object');
        if (address?.type.kind === 'object') {
          const properties = address.type.properties;
          expect(properties).toContainEqual({
            name: 'street',
            type: { kind: 'primitive', type: 'string' },
            isOptional: false,
            isReadonly: false,
            hasDefaultValue: false,
          });
        }
      }
      expect.assertions(3);
    });

    describe('Record types', () => {
      test('should parse Record<string, any>', () => {
        const filePath = path.join(FIXTURES_DIR, 'record-types.ts');
        const result = parser.parseFile(filePath);

        expect(result).toHaveLength(1);
        const parsed = result[0];
        if (parsed) {
          const metadata = parsed.properties.find((p) => p.name === 'metadata');
          expect(metadata?.type.kind).toBe('record');
          if (metadata?.type.kind === 'record') {
            expect(metadata.type.keyType).toEqual({ kind: 'primitive', type: 'string' });
            expect(metadata.type.valueType).toEqual({ kind: 'primitive', type: 'any' });
          }
        }
        expect.assertions(4);
      });

      test('should parse Record<string, string>', () => {
        const filePath = path.join(FIXTURES_DIR, 'record-types.ts');
        const result = parser.parseFile(filePath);

        expect(result).toHaveLength(1);
        const parsed = result[0];
        if (parsed) {
          const tags = parsed.properties.find((p) => p.name === 'tags');
          expect(tags?.type.kind).toBe('record');
          if (tags?.type.kind === 'record') {
            expect(tags.type.keyType).toEqual({ kind: 'primitive', type: 'string' });
            expect(tags.type.valueType).toEqual({ kind: 'primitive', type: 'string' });
          }
        }
        expect.assertions(4);
      });

      test('should parse Record<number, number>', () => {
        const filePath = path.join(FIXTURES_DIR, 'record-types.ts');
        const result = parser.parseFile(filePath);

        expect(result).toHaveLength(1);
        const parsed = result[0];
        if (parsed) {
          const scores = parsed.properties.find((p) => p.name === 'scores');
          expect(scores?.type.kind).toBe('record');
          if (scores?.type.kind === 'record') {
            expect(scores.type.keyType).toEqual({ kind: 'primitive', type: 'number' });
            expect(scores.type.valueType).toEqual({ kind: 'primitive', type: 'number' });
          }
        }
        expect.assertions(4);
      });
    });

    describe('Intersection types', () => {
      test('should parse intersection of named type and object literal', () => {
        const filePath = path.join(FIXTURES_DIR, 'intersection-types.ts');
        const result = parser.parseFile(filePath);

        const extendedUser = result.find((c) => c.name === 'ExtendedUser');
        expect(extendedUser).toBeDefined();

        if (extendedUser) {
          const profile = extendedUser.properties.find((p) => p.name === 'profile');
          expect(profile?.type.kind).toBe('intersection');

          if (profile?.type.kind === 'intersection') {
            expect(profile.type.types).toHaveLength(2);

            const firstType = profile.type.types[0];
            expect(firstType?.kind).toBe('object');

            const secondType = profile.type.types[1];
            expect(secondType?.kind).toBe('object');
            if (secondType?.kind === 'object') {
              expect(secondType.properties).toContainEqual({
                name: 'timestamp',
                type: { kind: 'primitive', type: 'Date' },
                isOptional: false,
                isReadonly: false,
                hasDefaultValue: false,
              });
            }
          }
        }
        expect.assertions(6);
      });

      test('should parse intersection of two object literals', () => {
        const filePath = path.join(FIXTURES_DIR, 'intersection-types.ts');
        const result = parser.parseFile(filePath);

        const extendedUser = result.find((c) => c.name === 'ExtendedUser');
        expect(extendedUser).toBeDefined();

        if (extendedUser) {
          const mixed = extendedUser.properties.find((p) => p.name === 'mixed');
          expect(mixed?.type.kind).toBe('intersection');

          if (mixed?.type.kind === 'intersection') {
            expect(mixed.type.types).toHaveLength(2);
            expect(mixed.type.types[0]?.kind).toBe('object');
            expect(mixed.type.types[1]?.kind).toBe('object');
          }
        }
        expect.assertions(5);
      });
    });

    test('should parse never type', () => {
      const filePath = path.join(FIXTURES_DIR, 'never-types.ts');
      const result = parser.parseFile(filePath);

      expect(result).toHaveLength(1);
      const parsed = result[0];
      if (parsed) {
        const impossible = parsed.properties.find((p) => p.name === 'impossible');
        expect(impossible?.type).toEqual({ kind: 'never' });
      }
      expect.assertions(2);
    });
  });
});
