# Contributing to `schema-gen`

Thank you for contributing to `schema-gen`.

## Before You Start

- Search [existing issues](https://github.com/Naviary-Sanctuary/schema-gen/issues) before opening a new one.
- For bugs and features, use the issue templates for faster triage.

## Report Issues

Use the GitHub issue form:

- [Open an issue](https://github.com/Naviary-Sanctuary/schema-gen/issues/new/choose)

Include clear reproduction steps, expected behavior, and environment details.

## Development Setup

```bash
# 1. Fork and clone the repository
git clone https://github.com/<your-account>/schema-gen.git
cd schema-gen

# 2. Install dependencies
bun install

# 3. Run tests
bun test
```

## Create a Pull Request

1. Create a branch from `main`.

```bash
git checkout -b <branch-name>
```

2. Commit your changes.

```bash
git commit -m "feat: add support for ..."
```

3. Push your branch.

```bash
git push origin <branch-name>
```

4. Open a pull request using the PR template.

## Commit Messages

Conventional commit style is recommended:

- `feat`: new functionality
- `fix`: bug fix
- `docs`: documentation changes
- `refactor`: internal code changes without behavior change
- `test`: test updates
- `chore`: maintenance tasks
- `breaking`: major change that requires a breaking release

## Pull Request Checklist

- Keep changes focused and scoped.
- Add or update tests when behavior changes.
- Update docs when CLI/config behavior changes.
- Ensure lint, type checks, and tests pass locally.

## Code of Conduct

By participating, you agree to follow the [Code of Conduct](./CODE_OF_CONDUCT.md).

## License

By contributing, you agree that your contributions are licensed under the [MIT License](./LICENSE).
