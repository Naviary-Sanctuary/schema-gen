import type { SchemaGenOptions } from '@types';

export { SchemaGen } from './gen/schema-gen';

export type {
  SchemaGenOptions,
  GenerateResult,
  SchemaGenerationResult,
  ProgressCallback,
  ProgressEvent,
  Config,
  MappingRule,
  WriteModeType,
  ParsedClass,
  Property,
  PropertyType,
} from '@types';

export { ConfigLoader } from './config';
export { Parser } from './parser';
