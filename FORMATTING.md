# Code Formatting Guidelines

This project uses Prettier for automatic code formatting. This ensures consistent code style across the codebase and prevents code review discussions about formatting.

## Setup

The formatting tools are automatically installed when you run `npm install`. Pre-commit hooks are also set up to format code before committing.

## VS Code Integration

If you're using VS Code, the repository includes settings to automatically format code on save. You'll need to install the Prettier extension:

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X or Cmd+Shift+X)
3. Search for "Prettier - Code formatter"
4. Install the extension by Prettier

The workspace settings will automatically enable format-on-save.

## Manual Formatting

You can manually format code using these npm scripts:

- `npm run format` - Format all code files
- `npm run format:check` - Check if all files are formatted correctly (useful for CI)

## Formatting Configuration

The formatting rules are defined in `.prettierrc` at the root of the project. Here are the key settings:

- Double quotes for strings
- 2 spaces for indentation
- Maximum line length of 100 characters
- Trailing commas in objects and arrays (ES5 compatible)
- No semicolons at the end of statements

## Pre-commit Hook

A pre-commit hook automatically formats your code before committing. If for some reason this doesn't work, you can reinstall the hooks with:

```
npm run setup-hooks
```

## Ignoring Files

If you need to exclude specific files from formatting, add them to `.prettierignore`. 