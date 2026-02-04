export class TemplateLiteralDTO {
  /**
   * Simple template literal
   */
  id!: `id-${number}`;

  /**
   * Multi-part template literal
   */
  date!: `${number}-${number}-${number}`;

  /**
   * Template literal with union string
   */
  status!: `status-${'active' | 'inactive'}`;
}
