import { mkdir, writeFile, access } from 'node:fs/promises';
import { dirname } from 'path';
import type { VariableValue, WriteModeType } from '@types';
import { PathResolver } from '@libs/path';

/**
 * Result of a file write operation
 */
export interface WriteResult {
  /** Absolute or relative path where the file was written */
  filePath: string;

  /** Whether the file was newly created (true) or overwritten (false) */
  created: boolean;
}

export class FileWriter {
  private readonly pattern: string;
  private readonly mode: WriteModeType;
  private readonly pathResolver: PathResolver;
  private readonly variables?: Record<string, VariableValue>;

  constructor(config: { pattern: string; mode?: WriteModeType; variables?: Record<string, VariableValue> }) {
    this.pattern = config.pattern;
    this.mode = config.mode ?? 'separate';
    this.variables = config.variables;
    this.pathResolver = new PathResolver();
  }

  /**
   * Write schema files
   *
   * Automatically:
   * - Creates output directory if it doesn't exist
   * - Generates appropriate file name
   * - Overwrites existing files
   *
   * @param files
   * @returns
   */
  async write(files: { code: string; sourcePath: string }[]): Promise<WriteResult[]> {
    if (this.mode === 'inline') {
      return Promise.all(files.map(async ({ code, sourcePath }) => this.writeInline(code, sourcePath)));
    }
    return Promise.all(files.map(async ({ code, sourcePath }) => this.writeSeparate(code, sourcePath)));
  }

  /**
   * Write schema inline to the source file (inline mode)
   *
   * Not yet implemented
   *
   * @param code - The schema code to write
   * @param sourcePath - The path to the source file
   * @returns The result of the write operation
   */
  private async writeInline(code: string, sourcePath: string): Promise<WriteResult> {
    throw new Error('Inline mode not yet implemented');
  }
  /**
   * Write schema to a separate file (separate mode)
   *
   * @param code - The schema code to write
   * @param sourcePath - The path to the source file
   * @returns The result of the write operation
   */
  private async writeSeparate(code: string, sourcePath: string): Promise<WriteResult> {
    const outputFilePath = this.pathResolver.resolve(sourcePath, this.pattern, this.variables);
    await this.ensureDirectoryExists(dirname(outputFilePath));

    const fileExists = await access(outputFilePath)
      .then(() => true)
      .catch(() => false);

    await writeFile(outputFilePath, code);

    return {
      filePath: outputFilePath,
      created: !fileExists,
    };
  }

  /**
   * Ensure a directory exists, creating it recursively if needed
   *
   * Create all parent directories if they don't exist
   * Does not throw error if directory already exists
   *
   * @param dirPath - Directory path to ensure exists
   */
  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await mkdir(dirPath, { recursive: true });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
        throw error;
      }
    }
  }
}
