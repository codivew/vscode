# Codivew for VS Code

Review working tree, staged, or branch changes with Codivew and a local Ollama model.

Open Codivew from the Activity Bar and complete the initial setup by selecting a workspace, entering a valid Ollama URL, and choosing an installed model. After setup, select only the review range to preview its changed files, lines, and filtered diff size, then click **리뷰 시작**. Change the workspace, Ollama connection, model, or maximum diff size from the Settings tab. Findings are added to the Problems panel. Open the full report from the result card when needed.

The extension imports its review engine from the public `codivew/core` API.

Run `npm install` and `npm run package` to build a VSIX. Use `npm run test:extension` for VS Code or `npm run test:cursor` for an installed Cursor app.
