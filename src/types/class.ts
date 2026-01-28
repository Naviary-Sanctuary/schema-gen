import type { Property } from './property';

/**
 * Complete information extracted from a TypeScript class
 *
 * This is the final output of the Parser.
 *
 * @example
 * ```typescript
 * // Input: src/dto/user.ts
 * export class UserResponse {
 *   id: string;
 *   name: string;
 *   email: string;
 * }
 *
 * // Output: ParsedClass
 * {
 *   name: 'UserResponse',
 *   filePath: 'src/dto/user.ts',
 *   isExported: true,
 *   properties: [
 *     { name: 'id', type: { kind: 'primitive', type: 'string' }, ... },
 *     { name: 'name', type: { kind: 'primitive', type: 'string' }, ... },
 *     { name: 'email', type: { kind: 'primitive', type: 'string' }, ... }
 *   ]
 * }
 * ```
 */
export interface ParsedClass {
  /** Class name */
  name: string;

  /** Source file path */
  filePath: string;

  /** All properties in the class */
  properties: Property[];

  /** Whether the class is exported */
  isExported: boolean;
}
