# schema-gen

`schema-gen` is a CLI that generates runtime validation schemas from exported TypeScript classes.

It helps you keep class models and validation schemas in sync without hand-writing the same structure twice.

## Why schema-gen

When projects grow, it is easy for class definitions and validation schemas to drift.
`schema-gen` reduces that maintenance cost by generating schemas directly from class types.

## Features

- Generate schemas from exported TypeScript classes.
- Support multiple generators: `elysia`, `typebox`, and `zod`.
- Configure file matching and output paths with glob patterns.
- Use built-in and custom output variables.
- Exclude patterns globally.
- Generate for all matched files or a single target file.

## Requirements

- Bun `>= 1.0.0` or Node.js `>= 18.0.0`
- TypeScript `^5.9.3` (peer dependency)

## Installation

### Homebrew (macOS/Linux)

```bash
brew tap Naviary-Sanctuary/schema-gen
brew install schema-gen
```

### Bun

```bash
bun install -g @naviary-sanctuary/schema-gen
```

### npm

```bash
npm install -g @naviary-sanctuary/schema-gen
```

### Install Script

```bash
curl -fsSL https://raw.githubusercontent.com/Naviary-Sanctuary/schema-gen/main/install.sh | bash
```

### Manual Binary

Download from [GitHub Releases](https://github.com/Naviary-Sanctuary/schema-gen/releases):

```bash
# macOS (arm64)
curl -L https://github.com/Naviary-Sanctuary/schema-gen/releases/latest/download/schema-gen-macos-arm64 -o schema-gen
chmod +x schema-gen
sudo mv schema-gen /usr/local/bin/

# Linux (x64)
curl -L https://github.com/Naviary-Sanctuary/schema-gen/releases/latest/download/schema-gen-linux-x64 -o schema-gen
chmod +x schema-gen
sudo mv schema-gen /usr/local/bin/
```

## Quick Start

### 1. Initialize config

```bash
schema-gen init
```

This creates `schema-gen.config.json`.

### 2. Add an exported class

```typescript
// src/models/user.ts
export class User {
  id: string;
  name: string;
  email: string;
  age?: number;
  tags: string[];
  createdAt: Date;
}
```

### 3. Generate schemas

```bash
schema-gen generate
```

### 4. Generated output example (`elysia`)

```typescript
import { t } from 'elysia';

export const userSchema = t.Object({
  id: t.String(),
  name: t.String(),
  email: t.String(),
  age: t.Optional(t.Number()),
  tags: t.Array(t.String()),
  createdAt: t.Date(),
});
```

## CLI Reference

### `schema-gen init`

Create a default `schema-gen.config.json` in the current directory.

```bash
schema-gen init
```

### `schema-gen generate`

Generate schemas using the configured mappings.

```bash
# Use default config path: ./schema-gen.config.json
schema-gen generate

# Pass config path as positional argument
schema-gen generate ./schema-gen.prod.json

# Pass config path using option
schema-gen generate --config ./schema-gen.prod.json

# Generate for a single source file
schema-gen generate --target src/models/user.ts
```

## Configuration

### Full config shape

```json
{
  "tsConfigPath": "tsconfig.json",
  "mappings": [
    {
      "include": ["src/**/*.ts"],
      "output": {
        "pattern": "schemas/{filename}.schema.ts"
      },
      "variables": {
        "module": {
          "regex": "src/modules/([^/]+)/"
        },
        "version": "v1"
      }
    }
  ],
  "generator": "elysia",
  "mode": "separate",
  "exclude": ["**/*.test.ts", "**/*.spec.ts"],
  "overwrite": false
}
```

### Options

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `tsConfigPath` | `string` | No | Path to `tsconfig.json` used by the parser. |
| `mappings` | `MappingRule[]` | Yes | Input/output rules for source files. |
| `generator` | `"elysia" \| "typebox" \| "zod"` | Yes | Generator backend for output schema code. |
| `mode` | `"separate" \| "inline"` | No | Write mode. `inline` is not implemented yet. |
| `exclude` | `string[]` | No | Global exclude patterns. |
| `overwrite` | `boolean` | No | Overwrite existing files. Default is `false`. |

### Mapping rule

```typescript
{
  include: string[];
  output: {
    pattern: string;
  };
  variables?: Record<string, string | { regex: string }>;
}
```

### Output variables

Built-in variables for `output.pattern`:

- `{filename}`: source filename without extension
- `{dirname}`: source directory path
- `{extension}`: source file extension

### Custom variables

Static variable:

```json
{
  "include": ["src/**/*.ts"],
  "output": { "pattern": "generated/{version}/{filename}.schema.ts" },
  "variables": {
    "version": "v1"
  }
}
```

Regex variable (first capture group is used):

```json
{
  "include": ["src/modules/*/domain/*.ts"],
  "output": { "pattern": "generated/{module}/{filename}.schema.ts" },
  "variables": {
    "module": { "regex": "src/modules/([^/]+)/" }
  }
}
```

If the source file is `src/modules/user/domain/model.ts`, `{module}` becomes `user`.

## Supported TypeScript Types

- Primitive: `string`, `number`, `boolean`, `Date`, `null`, `undefined`, `any`
- Array types
- Object types
- Union and intersection types
- Literal types (`"active"`, `1`, `true`, etc.)
- Template literal types (mapped to string-compatible output)
- `Record<K, V>` and index-signature-like record objects
- `never`

## Generators

- `elysia` -> `import { t } from 'elysia'`
- `typebox` -> `import { Type as t } from '@sinclair/typebox'`
- `zod` -> `import { z } from 'zod'`

## Current Limitations

- Only exported classes are parsed.
- `inline` mode is not implemented yet.
- Files are not overwritten unless `overwrite: true` is set.

## Development

```bash
# Install dependencies
bun install

# Run CLI in development
bun run dev

# Build
bun run build

# Test
bun test

# Type check
bun run typecheck

# Lint
bun run lint

# Format
bun run format
```

## Contributing

This project follows the [Contributor Covenant Code of Conduct](./CODE_OF_CONDUCT.md).

See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines.

## License

[MIT](./LICENSE)
