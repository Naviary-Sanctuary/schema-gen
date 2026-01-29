import { mkdir } from 'fs/promises';
import { basename, dirname, join } from 'path';
import type { WriteModeType } from '@types';

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
  private readonly outputDir: string;
  private readonly suffix: string;
  private readonly mode: WriteModeType;

  constructor(config: { outputDir: string; suffix?: string; mode?: WriteModeType }) {
    this.outputDir = config.outputDir;
    this.suffix = config.suffix ?? '.schema.ts';
    this.mode = config.mode ?? 'separate';
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
    const outputFilePath = this.generateOutputFilePath(sourcePath);
    await this.ensureDirectoryExists(dirname(outputFilePath));

    const fileExists = await Bun.file(outputFilePath).exists();

    await Bun.write(outputFilePath, code);

    return {
      filePath: outputFilePath,
      created: !fileExists,
    };
  }

  /**
   * Generate output file path from source path
   *
   * @param sourcePath - Original source file path
   * @returns The output file path
   */
  private generateOutputFilePath(sourcePath: string): string {
    const fullBasename = basename(sourcePath);
    const baseNameWithoutExtension = fullBasename.replace(/\.ts$/, '');
    return join(this.outputDir, `${baseNameWithoutExtension}${this.suffix}`);
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
