/**
 * Result of single schema generation
 */
export interface SchemaGenerationResult {
  /**
   * Source file path that was processed
   */
  sourcePath: string;
  /**
   * Generated schema file path
   */
  outputPath: string;
  /**
   * Schema name (e.g., 'userSchema)
   */
  schemaName: string;
  /**
   * Whether the output file was newly created (true) or overwritten (false)
   */
  created: boolean;
}

/**
 * Complete result of the schema generation process
 */
export interface GenerateResult {
  /**
   * All generated schemas
   */
  schemas: SchemaGenerationResult[];

  /**
   * Total number of source files processed
   */
  filesProcessed: number;

  /**
   * Total number of schemas generated
   */
  schemasGenerated: number;

  /**
   * Total number of new files created
   */
  filesCreated: number;

  /**
   * Total number of files overwritten
   */
  filesOverwritten: number;
}

/**
 * Progress callback function type
 */
export type ProgressCallback = (event: ProgressEvent) => void;

/**
 * Progress event types
 *
 * Allows monitoring of the schema generation process.
 */
export type ProgressEvent =
  | { type: 'start'; totalFiles: number }
  | { type: 'file-processing'; filePath: string; current: number; total: number }
  | { type: 'file-complete'; filePath: string; schemasGenerated: number }
  | { type: 'complete'; result: GenerateResult };

/**
 * Options for SchemaGen
 */
export interface SchemaGenOptions {
  /** Progress callback for monitoring generation process */
  onProgress?: ProgressCallback;
}
