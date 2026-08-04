# Changelog

All notable changes to Codivew for VS Code are documented in this file.

## 0.2.2

### Added

- Current Git branch information with an accessible refresh action on the Review page.
- Automatic local and remote branch discovery for base-branch selection in both the Review page
  and branch-review command.
- A persistent `npm run dev` command for opening the extension in a development VS Code window.

### Changed

- The Results tab now remains visible and is disabled until a review result is available.
- Base branches are selected from Git data instead of being entered as free-form text.
- The Review page uses a more compact layout with reduced outer spacing, a read-only current-branch
  field, and Lucide icons.
- Extension host code is organized by commands, review flow, repository access, webview handling,
  and result presentation.
- Build, ESLint, and test runner configuration files now use the project's standard ESM `.js`
  convention, and linting includes development and test scripts.
- The README screenshot reflects the latest Review page design.

## 0.2.1

### Fixed

- Automatic language detection now follows the Korean display locale in Cursor as well as VS Code.

### Changed

- Webview navigation now uses React Router for the Review, Results, and Settings pages while
  preserving setup guards, automatic Results navigation, and restored tab state.
- Route-level views are now organized as pages, with reusable state and components remaining in
  their feature modules.

## 0.2.0

### Added

- Changed-file selection for reviewing only the files you choose, with live file, line, and Diff
  size statistics.
- A Results tab that groups structured findings by file and supports severity filtering.
- Direct navigation from a review finding to its file and source line in the editor.

### Changed

- Reviews now open the Results tab when analysis completes while continuing to publish findings
  to the Problems panel and generate the complete HTML report.
- File navigation validates repository-relative paths before opening review findings.
- Updated the Activity Bar icon for consistent rendering in VS Code and Cursor themes.
- The release workflow now publishes the packaged extension to both Visual Studio Marketplace and
  Open VSX.

## 0.1.1

### Added

- English and Korean localization based on the VS Code display language, with English as the
  fallback locale.
- Localized review views, notifications, progress and error messages, commands, and settings.
- Matching language support for generated review feedback and HTML reports.
- Automatic language detection and fixed English or Korean selection from the Settings tab.

## 0.1.0

### Added

- Local Ollama-powered reviews for working tree, staged, and branch changes.
- Initial setup and settings screens for workspace, Ollama URL, model, and Diff limits.
- Changed-file and filtered Diff size previews before a review starts.
- Review findings in the VS Code Problems panel.
- Complete HTML review reports.
