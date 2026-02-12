import type { ParsedClass, Property, PropertyType } from '@types';
import type { SchemaGenerator } from '../schema-generator';

export class ZodGenerator implements SchemaGenerator {
  supports(type: string): boolean {
    return type === 'zod';
  }

  getImports(): string[] {
    return ['import { z } from "zod"'];
  }

  generate(parsedClass: ParsedClass): string {
    const imports = this.getImports().join('\n');
    const schemaName = this.generateSchemaName(parsedClass.name);
    const properties = this.generateProperties(parsedClass.properties);

    return `${imports}\n\nexport const ${schemaName} = z.object({ \n${properties} });`;
  }

  generateSchemaName(className: string): string {
    const camelCase = className.charAt(0).toLowerCase() + className.slice(1);
    return `${camelCase}Schema`;
  }

  private generateProperties(properties: Property[]): string {
    return properties.map((prop) => this.generateProperty(prop)).join(',\n');
  }

  private generateProperty(property: Property): string {
    const typeCode = this.generateType(property.type);
    const code = property.isOptional ? `${typeCode}.optional()` : typeCode;
    return `  ${property.name}: ${code}`;
  }

  private generateType(type: PropertyType): string {
    switch (type.kind) {
      case 'primitive':
        return this.generatePrimitiveType(type.type);
      case 'array':
        return `z.array(${this.generateType(type.elementType)})`;
      case 'object':
        return this.generateObjectType(type.properties);
      case 'union':
        return this.generateUnionType(type.types);
      case 'literal':
        return this.generateLiteralType(type.value);
      case 'record':
        return this.generateRecordType(type.keyType, type.valueType);
      case 'intersection':
        return this.generateIntersectionType(type.types);
      case 'templateLiteral':
        return 'z.string()';
      case 'never':
        return 'z.never()';
      default:
        const _exhaustive: never = type;
        throw new Error(`Unsupported type: ${JSON.stringify(_exhaustive)}`);
    }
  }

  private generatePrimitiveType(type: 'string' | 'number' | 'boolean' | 'Date' | 'null' | 'undefined' | 'any'): string {
    switch (type) {
      case 'string':
        return 'z.string()';
      case 'number':
        return 'z.number()';
      case 'boolean':
        return 'z.boolean()';
      case 'Date':
        return 'z.date()';
      case 'null':
        return 'z.null()';
      case 'undefined':
        return 'z.undefined()';
      case 'any':
        return 'z.any()';
      default:
        const _exhaustive: never = type;
        throw new Error(`Unsupported primitive type: ${JSON.stringify(_exhaustive)}`);
    }
  }

  private generateObjectType(properties: Property[]): string {
    const props = properties.map((prop) => this.generateProperty(prop)).join(',\n');
    return `z.object({\n${props}\n})`;
  }

  private generateUnionType(types: PropertyType[]): string {
    const typeCodes = types.map((t) => this.generateType(t)).join(', ');
    return `z.union([${typeCodes}])`;
  }

  private generateLiteralType(value: string | number | boolean): string {
    if (typeof value === 'string') {
      return `z.literal('${value}')`;
    }
    return `z.literal(${value})`;
  }

  private generateRecordType(keyType: PropertyType, valueType: PropertyType): string {
    const keyCode = this.generateType(keyType);
    const valueCode = this.generateType(valueType);
    return `z.record(${keyCode}, ${valueCode})`;
  }

  private generateIntersectionType(types: PropertyType[]): string {
    if (types.length === 0) {
      return 'z.never()';
    }

    if (types.length === 1) {
      return this.generateType(types[0]!);
    }

    const [first, second, ...rest] = types;
    let code = `z.intersection(${this.generateType(first!)}, ${this.generateType(second!)})`;

    for (const type of rest) {
      code = `z.intersection(${code}, ${this.generateType(type)})`;
    }

    return code;
  }
}
