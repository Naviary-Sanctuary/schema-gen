import { basename, dirname, extname } from 'path';

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
   *
   * @param sourcePath - Source file path to extract information from
   * @param pattern - Template pattern with variables
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
   * // Preserve directory structure
   * resolver.resolve('src/models/user.ts', '{dirname}/schemas/{filename}.ts');
   * // → 'src/models/schemas/user.ts'
   *
   * // Use extension
   * resolver.resolve('src/user.dto.ts', 'schemas/{filename}{extension}');
   * // → 'schemas/user.dto.ts'
   * ```
   */
  resolve(sourcePath: string, pattern: string): string {
    const path = this.extractPath(sourcePath);
    return this.applyPattern(pattern, path);
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
   * @returns Resolved path
   */
  private applyPattern(pattern: string, path: Path): string {
    return pattern
      .replaceAll('{filename}', path.filename)
      .replaceAll('{dirname}', path.dirname)
      .replaceAll('{extension}', path.extension);
  }
}
