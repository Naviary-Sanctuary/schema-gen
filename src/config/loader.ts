import { resolve } from 'path';
import {
  SUPPORTED_GENERATORS,
  WRITE_MODES,
  type Config,
  type MappingRule,
  type SupportedGeneratorType,
  type WriteModeType,
} from '@types';
import { ConfigNotFoundError, ConfigParseError, ConfigValidationError } from '@libs/errors';
import { isPlainObject } from 'es-toolkit';

const CONFIG_FILE_NAME = 'schema-gen.config.json';

/**
 * Configuration loader
 *
 * Handles loading and validating schema generation configuration.
 */
export class ConfigLoader {
  private readonly _configPath: string;

  constructor(configPath?: string) {
    this._configPath = configPath ? resolve(configPath) : resolve(process.cwd(), CONFIG_FILE_NAME);
  }

  get configPath() {
    return this._configPath;
  }

  async load(): Promise<Config> {
    const file = Bun.file(this.configPath);
    try {
      if (!(await file.exists())) {
        throw new ConfigNotFoundError(this.configPath);
      }

      const content = await file.text();
      const config = JSON.parse(content) as Config;
      this.validate(config);

      return config;
    } catch (err) {
      if (err instanceof SyntaxError) {
        throw new ConfigParseError(this.configPath, err.message);
      }

      throw err;
    }
  }

  private validate(config: Config) {
    if (!config || !isPlainObject(config)) {
      throw new ConfigValidationError('Config must be an object');
    }

    this.validateMappings(config.mappings);
    this.validateGenerator(config.generator);
    if (config.mode !== undefined) {
      this.validateMode(config.mode);
    }
    if (config.exclude !== undefined) {
      this.validateExclude(config.exclude);
    }
  }

  private validateMappings(mappings: MappingRule[]) {
    if (!Array.isArray(mappings)) {
      throw new ConfigValidationError('Config must have "mappings" array');
    }

    if (mappings.length === 0) {
      throw new ConfigValidationError('At least one mapping rule is required');
    }

    mappings.forEach((mapping, i) => {
      const prefix = `Mapping rule ${i + 1}`;
      if (!mapping || typeof mapping !== 'object') {
        throw new ConfigValidationError(`${prefix}: Must be an object`);
      }

      if (!Array.isArray(mapping.include) || mapping.include.length === 0) {
        throw new ConfigValidationError(`${prefix}: Must have "include" array with at least one pattern`);
      }

      for (const pattern of mapping.include) {
        if (typeof pattern !== 'string' || pattern.trim() === '') {
          throw new ConfigValidationError(`${prefix}: All "include" patterns must be non-empty strings`);
        }
      }

      if (!mapping.output || typeof mapping.output !== 'object') {
        throw new ConfigValidationError(`${prefix}: Must have "output" object`);
      }

      if (
        !mapping.output.pattern ||
        typeof mapping.output.pattern !== 'string' ||
        mapping.output.pattern.trim() === ''
      ) {
        throw new ConfigValidationError(`${prefix}: "output.pattern" must be a non-empty string`);
      }

      if (mapping.variables !== undefined) {
        this.validateVariables(mapping.variables, prefix);
      }
    });
  }

  private validateVariables(variables: Record<string, any>, prefix: string) {
    if (!isPlainObject(variables)) {
      throw new ConfigValidationError(`${prefix}: "variables" must be an object`);
    }

    for (const [key, value] of Object.entries(variables)) {
      if (typeof value === 'string') {
        continue;
      }

      if (isPlainObject(value) && typeof value.regex === 'string') {
        continue;
      }

      throw new ConfigValidationError(
        `${prefix}: Variable "${key}" must be a string or an object with a "regex" string field`,
      );
    }
  }

  private validateGenerator(generator: SupportedGeneratorType) {
    if (!generator) {
      throw new ConfigValidationError('Config must have "generator" field');
    }

    if (!SUPPORTED_GENERATORS.includes(generator)) {
      throw new ConfigValidationError(
        `Unsupported generator: "${generator}". Must be one of: ${SUPPORTED_GENERATORS.join(', ')}`,
      );
    }
  }

  private validateMode(mode: WriteModeType) {
    if (!WRITE_MODES.includes(mode)) {
      throw new ConfigValidationError(`Unsupported mode: "${mode}". Must be one of: ${WRITE_MODES.join(', ')}`);
    }
  }

  private validateExclude(exclude: string[]) {
    if (!Array.isArray(exclude)) {
      throw new ConfigValidationError('Config must have "exclude" array');
    }

    for (const pattern of exclude) {
      if (typeof pattern !== 'string' || pattern.trim() === '') {
        throw new ConfigValidationError(`All "exclude" patterns must be non-empty strings`);
      }
    }
  }
}
