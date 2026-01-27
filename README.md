# elysia-schema-gen

CLI tool to automatically generate Elysia schemas from TypeScript class definitions

## Why?

When using ElysiaJS, you often define classes for your DTOs (or domain models) and then have to manually write TypeBox schemas for validation:
```typescript
// 1. You write your class
class User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

// 2. Then you manually write the schema again 😫
const userResponseSchema = t.Object({
  id: t.String(),
  name: t.String(),
  email: t.String(),
  createdAt: t.Date()
})
```

This is:
- ❌ Repetitive and error-prone
- ❌ Hard to maintain (changes need to be synced)
- ❌ Time-consuming

**elysia-schema-gen** automatically generates elysia schemas from your TypeScript classes, keeping them in sync with a single command.

## Features

- 🚀 Generate schemas from TypeScript classes
- 📝 Two generation modes: separate file or inline
- ⚙️ Configurable via `elysia-schema.config.json`
- 🔧 CLI flags override config for one-off cases
- 🎯 Built with Bun for speed
- 🔌 Extensible architecture (Zod, Yup support planned)

## Tech Stack

- **Runtime**: Bun
- **Language**: TypeScript
- **AST Parsing**: ts-morph
- **CLI**: CAC

## Installation
```bash
bun install -g elysia-schema-gen
```

## Usage

Documentation coming soon once core features are implemented.

## Development
```bash
# Install dependencies
bun install

# Run in development
bun run dev

# Build
bun run build
```

## Configuration

Example `elysia-schema.config.json`:
```json
{
  "mode": "separate",
  "output": {
    "directory": "src/schemas",
    "suffix": ".schema.ts",
    "naming": "camelCase"
  },
  "generator": "typebox",
  "include": ["src/dto/**/*.ts"],
  "exclude": ["**/*.test.ts"]
}
```

## [Contributing](CONTRIBUTING.md)

This project is in early development. Contributions welcome once core architecture is stable.

## License

[MIT](LICENSE)