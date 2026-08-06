# Codivew for VS Code

Review Git changes with a local or remote AI model through an OpenAI-compatible API, without
leaving VS Code.

Codivew supports English and Korean across the review view, notifications, generated feedback,
reports, commands, and settings. It follows the VS Code display language by default, or you can
select a fixed language from the **Settings** tab.

![Codivew review view](media/codivew-review.png)

## Features

- Review working tree, staged, or branch changes.
- Select any model available on your OpenAI-compatible server (e.g. a local Ollama instance).
- Preview changed files, lines, and filtered Diff size before starting.
- Select the changed files to include in each review with live Diff statistics.
- Limit large reviews to avoid context overflow and slow responses.
- Browse structured findings by file and severity, then jump directly to the source line.
- View findings directly in the VS Code Problems panel.
- Open a complete HTML report after each review.

## Requirements

- VS Code 1.95 or later
- A Git repository opened as a workspace
- An OpenAI-compatible API server running locally or on an accessible host (e.g.
  [Ollama](https://ollama.com/))
- At least one model available on that server, plus an API key if the server requires
  authentication

## Getting Started

1. Open **Codivew** from the Activity Bar.
2. Select a workspace and enter the API server URL (and an API key, if your server requires one).
3. Choose an installed model and save the initial settings.
4. Select the review range and click **Start review**.
5. Review findings in the **Results** tab, jump to the source, or open the complete report.

Language, workspace, API connection, model, and maximum Diff size can be changed from the
**Settings** tab.

## Review Ranges

- **Working tree**: unstaged and untracked changes in the current workspace
- **Staged changes**: changes currently added to the Git index
- **Branch changes**: changes compared with a selected base branch

## Development

```bash
npm install
npm run check
npm run dev
npm run package
```

Use `npm run dev` to open a persistent VS Code Extension Host and `npm run test:extension` to run the integration test.

Codivew imports its review engine from the public `codivew/core` API.
