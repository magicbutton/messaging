# Generating Markdown Documentation

This document explains how to generate Markdown documentation for the Magic Button Messaging library.

## Prerequisites

1. Install the TypeDoc Markdown plugin:

```bash
npm install --save-dev typedoc-plugin-markdown
```

2. The typedoc.json and package.json files have already been configured to support Markdown output.

## Generating Markdown Documentation

To generate the Markdown documentation, run:

```bash
npm run docs:markdown
```

This will generate Markdown documentation in the `docs/markdown` directory.

## Documentation Structure

The Markdown documentation is organized by:

- **README.md** - Overview and navigation
- **classes.md** - All implementation classes
- **interfaces.md** - All interfaces and factory interfaces
- **types.md** - Type definitions
- **functions.md** - Utility and helper functions
- **modules.md** - Organizational modules

## Using the Markdown Documentation

The Markdown documentation is particularly useful for:

1. Integrating with documentation systems like GitBook or VuePress
2. Rendering in GitHub or GitLab wikis
3. Generating PDF documentation
4. Custom documentation sites

## Configuration

The TypeDoc Markdown plugin configuration is in `typedoc.json` and includes:

```json
{
  "plugin": ["typedoc-plugin-markdown"],
  "theme": "default",
  "disableSources": true,
  "hideBreadcrumbs": true
}
```

You can modify these settings to customize the Markdown output.

## Updating Documentation

When you update the source code with new JSDoc comments, simply run the `npm run docs` command to update both the HTML and Markdown documentation.