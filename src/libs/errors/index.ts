export class ConfigParseError extends Error {
  constructor(configPath: string, parseError: string) {
    super(`Invalid JSON in config file: ${configPath}\n${parseError}`);
    this.name = 'ConfigParseError';
  }
}

export class ConfigValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigValidationError';
  }
}

export class ConfigNotFoundError extends Error {
  constructor(configPath: string) {
    super(
      `Config file not found at: ${configPath}\n\n` +
        'Please create a config file by:\n' +
        '1. Run: schema-gen init\n' +
        '2. Or manually create: schema-gen.config.json',
    );
    this.name = 'ConfigNotFoundError';
  }
}
