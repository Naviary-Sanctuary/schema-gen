import type { SupportedGeneratorType } from './generator';

export const WRITE_MODES = ['separate', 'inline'] as const;
export type WriteModeType = (typeof WRITE_MODES)[number];

/**
 * Output pattern configuration
 */
export interface OutputPattern {
  /**
   * Output path pattern with template variables
   */
  pattern: string;
}

/**
 * Custom variable value type
 */
export type VariableValue = string | { regex: string };

/**
 * Mapping rule for file processing
 */
export interface MappingRule {
  /**
   * Glob patterns for file to include
   */
  include: string[];

  /**
   * Output pattern configuration
   */
  output: OutputPattern;

  /**
   * Custom variables for the output pattern
   */
  variables?: Record<string, VariableValue>;
}

/**
 * Main configuration object
 */
export interface Config {
  /** Path to tsconfig.json file */
  tsConfigPath?: string;
  /**
   * Mapping rules
   */
  mappings: MappingRule[];

  /**
   * Schema generator to use
   */
  generator: SupportedGeneratorType;

  /**
   * Generation mode (optional)
   */
  mode?: WriteModeType;

  /**
   * exclude patterns
   */
  exclude?: string[];

  /**
   * Whether to overwrite existing files
   * @default false
   */
  overwrite?: boolean;
}
