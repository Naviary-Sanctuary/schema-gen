import { basename, dirname, extname } from 'path';
import type { VariableValue } from '@types';

/**
 * Path information extracted from source file
 */
interface Path {
  /**
   * Filename without extension
   * @example "user" from "user.ts"
   */
  filename: string;
  /**
   * Directory name
   * @example "src/models" from "src/models/user.ts"
   */
  dirname: string;
  /**
   * File extension
   * @example ".ts" from "user.ts"
   */
  extension: string;
}

export class PathResolver {
  /**
   * Resolve a template pattern to actual path
   *
   * Supported template variables:
   * - {filename}: Filename without extension
   * - {dirname}: Directory path
   * - {extension}: File extension
   * - {key}: Custom variables defined in config
   *
   * @param sourcePath - Source file path to extract information from
   * @param pattern - Template pattern with variables
   * @param customVariables - Optional custom variables or regex-based extraction rules
   * @returns Resolved path
   *
   * @example
   * ```typescript
   * const resolver = new PathResolver();
   *
   * // Basic usage
   * resolver.resolve('src/user.ts', 'schemas/{filename}.schema.ts');
   * // → 'schemas/user.schema.ts'
   *
   * // Custom variables
   * resolver.resolve('src/user.ts', 'schemas/{version}/{filename}.ts', { version: 'v1' });
   * // → 'schemas/v1/user.ts'
   *
   * // Regex extraction
   * resolver.resolve('src/user/domain/model.ts', 'generated/{module}/{filename}.ts', {
   *   module: { regex: 'src/([^/]+)/' }
   * });
   * // → 'generated/user/model.ts'
   * ```
   */
  resolve(sourcePath: string, pattern: string, customVariables?: Record<string, VariableValue>): string {
    const path = this.extractPath(sourcePath);
    const evaluatedVariables = this.evaluateVariables(sourcePath, customVariables);

    return this.applyPattern(pattern, path, evaluatedVariables);
  }

  /**
   * Evaluate custom variables against source path
   */
  private evaluateVariables(sourcePath: string, variables?: Record<string, VariableValue>): Record<string, string> {
    if (!variables) return {};

    const evaluated: Record<string, string> = {};

    for (const [key, value] of Object.entries(variables)) {
      if (typeof value === 'string') {
        evaluated[key] = value;
      } else if (typeof value === 'object' && 'regex' in value) {
        const regex = new RegExp(value.regex);
        const match = sourcePath.match(regex);
        if (match && match[1]) {
          evaluated[key] = match[1];
        } else {
          evaluated[key] = ''; // Or perhaps a placeholder or throw-away
        }
      }
    }

    return evaluated;
  }

  /**
   * Extract path information from source file path
   *
   * @param sourcePath - Source file path
   * @returns Extracted path information
   *
   * @example
   * ```typescript
   * this.extractPath('src/models/user.ts');
   * // → { filename: 'user', dirname: 'src/models', ext: '.ts' }
   *
   * this.extractPath('user.dto.ts');
   * // → { filename: 'user.dto', dirname: '.', ext: '.ts' }
   * ```
   */

  private extractPath(sourcePath: string): Path {
    const extension = extname(sourcePath);
    const filename = basename(sourcePath, extension);
    const dir = dirname(sourcePath);

    return {
      filename,
      dirname: dir,
      extension,
    };
  }

  /**
   * Apply template pattern with path information
   *
   * Replaces all occurrences of template variables with actual values.
   *
   * @param pattern - Template pattern
   * @param path - Path information
   * @param customVariables - Evaluated custom variables
   * @returns Resolved path
   */
  private applyPattern(pattern: string, path: Path, customVariables: Record<string, string>): string {
    let resolved = pattern;

    for (const [key, value] of Object.entries(customVariables)) {
      resolved = resolved.replaceAll(`{${key}}`, value);
    }

    resolved = resolved
      .replaceAll('{filename}', path.filename)
      .replaceAll('{dirname}', path.dirname)
      .replaceAll('{extension}', path.extension);

    return resolved;
  }
}
