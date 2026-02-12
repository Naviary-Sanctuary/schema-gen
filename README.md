# schema-gen

CLI tool to automatically generate validation schemas from TypeScript class definitions

## Why?

When building APIs with validation, you often define classes for your DTOs (or domain models) and then have to manually write validation schemas:

```typescript
// 1. You write your class
class User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

// 2. Then you manually write the schema again
const userSchema = t.Object({
  id: t.String(),
  name: t.String(),
  email: t.String(),
  createdAt: t.Date(),
});
```

This is:

- ❌ Repetitive and error-prone
- ❌ Hard to maintain (changes need to be synced)
- ❌ Time-consuming

**schema-gen** automatically generates validation schemas from your TypeScript classes, keeping them in sync with a single command.

## Features

- 🚀 Generate schemas from TypeScript classes
- 📦 Multiple schema libraries: **Elysia**, **TypeBox**, and **Zod**
- 📝 Separate file generation (inline mode coming soon)
- ⚙️ Flexible configuration via `schema-gen.config.json`
- 🎯 Optimized for Bun, compatible with Node.js
- 🔧 CLI flags override config for one-off cases

## Installation

Choose your preferred installation method:

### Homebrew (macOS/Linux)

```bash
brew tap Naviary-Sanctuary/schema-gen
brew install schema-gen
```

### Bun (Recommended)

```bash
bun install -g @naviary-sanctuary/schema-gen
```

### Node.js / npm

This package supports Node.js >= 18.0.0.

```bash
npm install -g @naviary-sanctuary/schema-gen
```

### Quick Install Script

```bash
curl -fsSL https://raw.githubusercontent.com/Naviary-Sanctuary/schema-gen/main/install.sh | bash
```

### Manual Installation

Download the latest binary from [GitHub Releases](https://github.com/Naviary-Sanctuary/schema-gen/releases):

```bash
# macOS (ARM64)
curl -L https://github.com/Naviary-Sanctuary/schema-gen/releases/latest/download/schema-gen-macos-arm64 -o schema-gen
chmod +x schema-gen
sudo mv schema-gen /usr/local/bin/

# Linux (x64)
curl -L https://github.com/Naviary-Sanctuary/schema-gen/releases/latest/download/schema-gen-linux-x64 -o schema-gen
chmod +x schema-gen
sudo mv schema-gen /usr/local/bin/
```

## Quick Start

### 1. Initialize Configuration

```bash
schema-gen init
```

This creates a `schema-gen.config.json` file:

```json
{
  "mappings": [
    {
      "include": ["src/**/*.ts"],
      "output": {
        "pattern": "schemas/{filename}.schema.ts"
      }
    }
  ],
  "generator": "elysia",
  "exclude": ["**/*.test.ts", "**/*.spec.ts"]
}
```

### 2. Create Your Classes

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

### 3. Generate Schemas

```bash
schema-gen generate
```

### 4. Result

```typescript
// schemas/user.schema.ts
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

## CLI Commands

### `init`

Create a default configuration file:

```bash
schema-gen init
```

### `generate`

Generate schemas from your classes:

```bash
schema-gen generate

# With custom config path
schema-gen generate -c custom-config.json

# For specific file only (ignores "include" patterns)
schema-gen generate --target src/models/user.ts
```

## Configuration

### Basic Configuration

```json
{
  "mappings": [
    {
      "include": ["src/**/*.ts"],
      "output": {
        "pattern": "schemas/{filename}.schema.ts"
      }
    }
  ],
  "generator": "elysia",
  "exclude": ["**/*.test.ts", "**/*.spec.ts"]
}
```

### Configuration Options

| Option      | Type                     | Required | Description                                                 |
| ----------- | ------------------------ | -------- | ----------------------------------------------------------- |
| `mappings`  | `MappingRule[]`          | ✓        | Array of mapping rules defining input/output patterns       |
| `generator` | `"elysia" \| "typebox" \| "zod"` | ✓        | Schema generator to use                            |
| `exclude`   | `string[]`               | ✗        | Global exclude patterns                                     |
| `overwrite` | `boolean`                | ✗        | Whether to overwrite existing files (default: `false`)      |
| `mode`      | `"separate" \| "inline"` | ✗        | Generation mode (default: `"separate"`, inline coming soon) |

### Mapping Rule

Each mapping rule defines which files to process and where to output schemas:

```typescript
{
  "include": string[];  // Glob patterns for files to process
  "output": {
    "pattern": string;  // Output path pattern with variables
  },
  "variables": {        // [Optional] Custom variables
    [key: string]: string | { regex: string };
  }
}
```

### Output Pattern Variables

Use these variables in your output patterns:

- `{filename}`: Filename without extension (e.g., `user` from `user.ts`)
- `{dirname}`: Directory path (e.g., `src/models` from `src/models/user.ts`)
- `{extension}`: File extension (e.g., `.ts`)

### Custom Variables

You can define custom variables for each mapping rule. These can be static strings or dynamic values extracted from the source file path using regular expressions.

#### Static Variables

```json
{
  "include": ["src/**/*.ts"],
  "output": { "pattern": "generated/{version}/{filename}.ts" },
  "variables": {
    "version": "v1"
  }
}
```

#### Dynamic Extraction (Regex)

Extract parts of the source path using the first capturing group of a regular expression:

```json
{
  "include": ["src/modules/*/domain/*.ts"],
  "output": { "pattern": "generated/{module}/{filename}.schema.ts" },
  "variables": {
    "module": { "regex": "src/modules/([^/]+)/" }
  }
}
```

If the source file is `src/modules/user/domain/model.ts`, the `{module}` variable will be `user`.

> [!TIP]
> Custom variables can also be used to override built-in variables like `{filename}` or `{dirname}` if you define them with the same name.

### Advanced Configuration Examples

#### Multiple Mappings

Process different source directories to different outputs:

```json
{
  "mappings": [
    {
      "include": ["src/models/**/*.ts"],
      "output": {
        "pattern": "src/route/{filename}/schema.ts"
      }
    },
    {
      "include": ["src/dto/**/*.ts"],
      "output": {
        "pattern": "src/api/schemas/{filename}.schema.ts"
      }
    }
  ],
  "generator": "elysia"
}
```

**Result:**

```
src/models/user.ts       → src/route/user/schema.ts
src/dto/product.dto.ts   → src/api/schemas/product.dto.schema.ts
```

#### Preserve Directory Structure

Keep the original directory structure in output:

```json
{
  "mappings": [
    {
      "include": ["src/**/*.ts"],
      "output": {
        "pattern": "{dirname}/schemas/{filename}.schema.ts"
      }
    }
  ],
  "generator": "typebox"
}
```

**Result:**

```
src/models/user.ts              → src/models/schemas/user.schema.ts
src/models/domain/product.ts    → src/models/domain/schemas/product.schema.ts
```

#### Negative Patterns

Exclude specific patterns from processing:

```json
{
  "mappings": [
    {
      "include": ["src/**/*.ts", "!src/draft/**", "!src/internal/**"],
      "output": {
        "pattern": "schemas/{filename}.schema.ts"
      }
    }
  ],
  "generator": "elysia",
  "exclude": ["**/*.test.ts", "**/*.spec.ts", "**/*.d.ts"]
}
```

## Supported Types

schema-gen supports a wide range of TypeScript types:

### Primitives

- `string`, `number`, `boolean`, `Date`
- `null`, `undefined`, `any`

### Arrays

```typescript
tags: string[]           // → t.Array(t.String())
matrix: number[][]       // → t.Array(t.Array(t.Number()))
```

### Objects

```typescript
address: {
  street: string;
  city: string;
}
// → t.Object({ street: t.String(), city: t.String() })
```

### Unions & Literals

```typescript
status: 'active' | 'inactive'; // → t.UnionEnum(['active', 'inactive'])
priority: 1 | 2 | 3; // → t.UnionEnum([1, 2, 3])
value: string | number; // → t.Union([t.String(), t.Number()])
```

### Optional Properties

```typescript
age?: number             // → t.Optional(t.Number())
```

## Schema Generators

### Elysia

Uses Elysia's built-in `t` utility:

```typescript
import { t } from 'elysia';

export const userSchema = t.Object({
  id: t.String(),
  name: t.String(),
});
```

### TypeBox

Uses standalone TypeBox library:

```typescript
import { Type as t } from '@sinclair/typebox';

export const userSchema = t.Object({
  id: t.String(),
  name: t.String(),
});
```

## Development

```bash
# Install dependencies
bun install

# Run in development
bun run dev

# Build
bun run build

# Run tests
bun test

# Type checking
bun run typecheck

# Linting
bun run lint

# Formatting
bun run format
```

## Contributing

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md).

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

## License

[MIT](LICENSE)
