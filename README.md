# Codivew for VS Code

Review Git changes with a local Ollama model without leaving VS Code.

![Codivew review view](media/codivew-review.png)

## Features

- Review working tree, staged, or branch changes.
- Select any model installed in your local Ollama instance.
- Preview changed files, lines, and filtered Diff size before starting.
- Limit large reviews to avoid context overflow and slow responses.
- View findings directly in the VS Code Problems panel.
- Open a complete HTML report after each review.

## Requirements

- VS Code 1.95 or later
- A Git repository opened as a workspace
- [Ollama](https://ollama.com/) running locally or on an accessible server
- At least one model installed in Ollama

## Getting Started

1. Open **Codivew** from the Activity Bar.
2. Select a workspace and enter the Ollama server URL.
3. Choose an installed model and save the initial settings.
4. Select the review range and click **리뷰 시작**.
5. Review findings in the Problems panel or open the complete report.

Workspace, Ollama connection, model, and maximum Diff size can be changed from the **설정** tab.

## Review Ranges

- **Working tree**: unstaged and untracked changes in the current workspace
- **Staged changes**: changes currently added to the Git index
- **Branch changes**: changes compared with a selected base branch

## Development

```bash
npm install
npm run check
npm run package
```

Use `npm run test:extension` for VS Code or `npm run test:cursor` for an installed Cursor app.

Codivew imports its review engine from the public `codivew/core` API.
