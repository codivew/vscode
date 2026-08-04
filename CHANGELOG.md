# Changelog

All notable changes to Codivew for VS Code are documented in this file.

## 0.2.0 - 2026-08-04

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

## 0.1.1 - 2026-08-04

### Added

- English and Korean localization based on the VS Code display language, with English as the
  fallback locale.
- Localized review views, notifications, progress and error messages, commands, and settings.
- Matching language support for generated review feedback and HTML reports.
- Automatic language detection and fixed English or Korean selection from the Settings tab.

## 0.1.0 - 2026-08-03

### Added

- Local Ollama-powered reviews for working tree, staged, and branch changes.
- Initial setup and settings screens for workspace, Ollama URL, model, and Diff limits.
- Changed-file and filtered Diff size previews before a review starts.
- Review findings in the VS Code Problems panel.
- Complete HTML review reports.
