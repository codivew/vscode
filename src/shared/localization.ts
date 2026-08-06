export type Locale = 'en' | 'ko-KR';
export type LanguagePreference = 'auto' | Locale;

const messages = {
  'nav.menu': ['Codivew menu', 'Codivew 메뉴'],
  'nav.review': ['Review', '리뷰'],
  'nav.results': ['Results', '결과'],
  'nav.settings': ['Settings', '설정'],
  'review.environment': ['Current review environment', '현재 리뷰 환경'],
  'review.noWorkspace': ['No workspace', '워크스페이스 없음'],
  'review.noModel': ['No model configured', '모델 미설정'],
  'review.change': ['Change', '변경'],
  'review.currentBranch': ['Current branch', '현재 브랜치'],
  'review.refreshCurrentBranch': ['Refresh', '새로고침'],
  'review.currentBranchLoading': ['Loading...', '확인 중...'],
  'review.currentBranchUnavailable': ['Unavailable', '확인할 수 없음'],
  'review.detachedHead': ['Detached HEAD', '분리된 HEAD'],
  'review.branchesLoading': ['Loading branches...', '브랜치 조회 중...'],
  'review.branchesUnavailable': ['No base branch available', '선택 가능한 기준 브랜치 없음'],
  'review.scope': ['Review scope', '리뷰 범위'],
  'review.baseBranch': ['Base branch', '기준 브랜치'],
  'review.start': ['Start review', '리뷰 시작'],
  'review.cancel': ['Cancel', '취소'],
  'review.verdict': ['Verdict', '판정'],
  'review.files': ['Files', '파일'],
  'review.items': ['Issues', '항목'],
  'review.openReport': ['Open full report', '전체 리포트 열기'],
  'results.title': ['Review results', '리뷰 결과'],
  'results.summary': ['Summary', '요약'],
  'results.verdict': ['Verdict', '판정'],
  'results.risk': ['Risk', '위험도'],
  'results.files': ['Files', '파일'],
  'results.issues': ['Issues', '이슈'],
  'results.filter': ['Severity filter', '심각도 필터'],
  'results.allSeverities': ['All severities', '모든 심각도'],
  'results.mustFix': ['Must fix', '필수 수정'],
  'results.shouldFix': ['Should fix', '수정 권장'],
  'results.suggestion': ['Suggestion', '제안'],
  'results.lowRisk': ['Low', '낮음'],
  'results.mediumRisk': ['Medium', '보통'],
  'results.highRisk': ['High', '높음'],
  'results.noIssues': [
    'No issues were found in the selected changes.',
    '선택한 변경사항에서 이슈를 발견하지 못했습니다.',
  ],
  'results.noFilteredIssues': [
    'No issues match this filter.',
    '이 필터에 해당하는 이슈가 없습니다.',
  ],
  'results.line': ['Line {line}', '{line}행'],
  'results.lineRange': ['Lines {start}-{end}', '{start}-{end}행'],
  'results.confidence': ['{value}% confidence', '신뢰도 {value}%'],
  'results.openIssue': ['Open in editor', '편집기에서 열기'],
  'results.skipIssue': ['Skip', '건너뛰기'],
  'results.restoreIssue': ['Restore', '복원'],
  'results.skipped': ['Skipped', '건너뜀'],
  'results.edited': ['Edited · review needed', '수정됨 · 재검토 필요'],
  'results.reviewEditedFiles': ['Review edited files', '수정한 파일 다시 검토'],
  'results.reviewingEditedFiles': ['Reviewing edited files...', '수정한 파일 검토 중...'],
  'results.clearUnderlines': ['Clear all underlines', '모든 밑줄 지우기'],
  'results.restoreUnderlines': ['Restore underlines', '밑줄 다시 표시'],
  'results.impact': ['Impact', '영향'],
  'results.fixSuggestion': ['Suggested fix', '수정 제안'],
  'results.codeSnippet': ['Related code', '관련 코드'],
  'results.tests': ['Recommended tests', '권장 테스트'],
  'results.openReport': ['Open full HTML report', '전체 HTML 리포트 열기'],
  'review.selectWorkspace': ['Select a workspace.', '워크스페이스를 선택하세요.'],
  'review.enterBaseBranch': ['Select a base branch.', '기준 브랜치를 선택하세요.'],
  'review.ready': ['Ready to review.', '리뷰할 준비가 되었습니다.'],
  'review.scopeCalculating': ['Calculating the change scope...', '변경 범위를 계산하는 중...'],
  'review.gitCalculating': ['Calculating Git changes...', 'Git 변경량을 계산하는 중...'],
  'targets.title': ['Review targets', '리뷰 대상'],
  'targets.loading': ['Loading changed files...', '파일 목록을 불러오는 중...'],
  'targets.error': ['Could not load changed files.', '변경 파일을 불러오지 못했습니다.'],
  'targets.empty': ['There are no changed files to review.', '리뷰할 변경 파일이 없습니다.'],
  'targets.fileCount': ['{count} files', '{count}개 파일'],
  'targets.singleFile': ['1 file', '1개 파일'],
  'targets.selectedCount': [
    '{selected} of {total} files selected',
    '전체 {total}개 중 {selected}개 선택',
  ],
  'targets.selectAll': ['Select all', '전체 선택'],
  'targets.clearAll': ['Clear', '전체 해제'],
  'targets.openFile': ['Open file', '파일 열기'],
  'targets.openFileNamed': ['Open {path}', '{path} 열기'],
  'targets.noSelection': [
    'Select at least one file to start a review.',
    '리뷰를 시작하려면 파일을 하나 이상 선택하세요.',
  ],
  'targets.lineCount': ['{count} lines changed', '{count}줄 변경'],
  'targets.filteredDiff': ['Filtered Diff', '필터링된 Diff'],
  'targets.characters': ['{count} chars', '{count}자'],
  'targets.diffSize': ['Filtered Diff size', '필터링된 Diff 크기'],
  'targets.overLimit': [
    'Exceeds the maximum by {count} characters.',
    '최대 크기를 {count}자 초과했습니다.',
  ],
  'settings.title': ['Review environment', '리뷰 환경 설정'],
  'settings.getStarted': ['Get started with Codivew', 'Codivew 시작하기'],
  'settings.description': [
    'Select a project and local AI model for reviews.',
    '리뷰할 프로젝트와 로컬 AI 모델을 선택합니다.',
  ],
  'settings.workspace': ['Default workspace', '기본 워크스페이스'],
  'settings.noOpenWorkspace': ['No workspace is open', '열린 워크스페이스가 없습니다'],
  'settings.workspaceHint': [
    'This project will be selected by default on the review screen.',
    '리뷰 화면에서 기본으로 사용할 프로젝트입니다.',
  ],
  'settings.language': ['Language', '언어'],
  'settings.languageHint': [
    'Follow the VS Code display language or choose a fixed language.',
    'VS Code 표시 언어를 따르거나 사용할 언어를 고정합니다.',
  ],
  'settings.languageAuto': ['Automatic (VS Code)', '자동 (VS Code)'],
  'settings.languageEnglish': ['English', 'English'],
  'settings.languageKorean': ['Korean', '한국어'],
  'settings.sizeTitle': ['Review size limit', '리뷰 크기 제한'],
  'settings.sizeDescription': [
    'Prevent context overflow and slow responses from large Diffs.',
    '큰 Diff로 인한 컨텍스트 초과와 응답 지연을 방지합니다.',
  ],
  'settings.maxDiff': ['Maximum Diff characters', '최대 Diff 문자 수'],
  'settings.maxDiffHint': [
    'Calculated from the character count after Diff filtering.',
    '필터링이 끝난 Diff의 문자 수를 기준으로 계산합니다.',
  ],
  'settings.presets': ['Diff size presets', 'Diff 크기 프리셋'],
  'settings.saving': ['Saving...', '저장 중...'],
  'settings.save': ['Save settings', '설정 저장'],
  'settings.saveAndStart': ['Save and get started', '설정 저장하고 시작'],
  'settings.diffDescription': [
    'Set the filtered Diff size sent in a single review.',
    '한 번의 리뷰에 전달할 필터링된 Diff 크기를 설정합니다.',
  ],
  'settings.changed': [
    'Save the new value to use it in the next review.',
    '변경된 값을 저장하면 다음 리뷰부터 적용됩니다.',
  ],
  'settings.savingStatus': ['Saving settings...', '설정을 저장하는 중...'],
  'model.url': ['AI Server URL', 'AI 서버 URL'],
  'model.urlHint': [
    'This address is saved in your Codivew user settings.',
    '입력한 주소는 Codivew 사용자 설정에 저장됩니다.',
  ],
  'model.apiKey': ['API Key', 'API 키'],
  'model.apiKeyPlaceholder': ['Optional', '선택 사항'],
  'model.apiKeyHint': [
    'Only needed for servers that require authentication. Sent as a Bearer token.',
    '인증이 필요한 서버에만 입력하세요. Bearer 토큰으로 전송됩니다.',
  ],
  'model.label': ['Model', '모델'],
  'model.loading': ['Loading models...', '모델 조회 중...'],
  'model.none': ['No models available', '선택 가능한 모델이 없습니다'],
  'model.enterUrl': ['Enter an AI server URL.', 'AI 서버 URL을 입력하세요.'],
  'model.invalidUrl': [
    'Enter a valid HTTP or HTTPS server URL.',
    '올바른 HTTP 또는 HTTPS 서버 URL을 입력하세요.',
  ],
  'model.fetching': ['Loading installed models...', '설치된 모델을 조회하는 중...'],
  'host.alreadyRunning': [
    'A Codivew review is already running.',
    '이미 Codivew 리뷰가 진행 중입니다.',
  ],
  'host.reviewTitle': ['Codivew review', 'Codivew 리뷰'],
  'host.completed': [
    'Codivew review complete: {files} files, {issues} issues',
    'Codivew 리뷰 완료: {files}개 파일, {issues}개 항목',
  ],
  'host.failed': ['Codivew review failed: {message}', 'Codivew 리뷰 실패: {message}'],
  'host.noReport': [
    'No Codivew report has been generated yet.',
    '아직 생성된 Codivew 리포트가 없습니다.',
  ],
  'host.issueUnavailable': [
    'This review issue is no longer available.',
    '이 리뷰 이슈를 더 이상 열 수 없습니다.',
  ],
  'host.issueFileError': [
    'Could not open the reviewed file: {message}',
    '리뷰 파일을 열 수 없습니다: {message}',
  ],
  'host.fileUnavailable': [
    'This file is not available in the selected workspace.',
    '선택한 워크스페이스에서 이 파일을 열 수 없습니다.',
  ],
  'host.fileOpenError': ['Could not open the file: {message}', '파일을 열 수 없습니다: {message}'],
  'host.collecting': ['Collecting Git changes...', 'Git 변경사항 수집 중...'],
  'host.generating': ['Generating review...', '리뷰 생성 중...'],
  'host.reportComplete': ['Report generated', '리포트 생성 완료'],
  'host.branchReview': ['Codivew branch review', 'Codivew 브랜치 리뷰'],
  'host.branchPrompt': ['Select the base branch.', '기준 브랜치를 선택하세요.'],
  'host.openWorkspace': [
    'Open a workspace folder to run Codivew.',
    'Codivew를 실행할 워크스페이스 폴더를 여세요.',
  ],
  'host.selectWorkspace': ['Select a workspace for Codivew', 'Codivew를 실행할 워크스페이스 선택'],
  'host.defaultWorkspace': ['Select a default workspace.', '기본 워크스페이스를 선택하세요.'],
  'host.selectModel': ['Select a model to use.', '사용할 모델을 선택하세요.'],
  'host.enterModel': ['Enter the model name to use.', '사용할 모델명을 입력하세요.'],
  'host.maxDiffInvalid': [
    'Maximum Diff size must be an integer of at least 1,000 characters.',
    '최대 Diff 크기는 1,000자 이상의 정수여야 합니다.',
  ],
  'host.settingsSaved': ['Review environment settings saved.', '리뷰 환경 설정을 저장했습니다.'],
  'host.invalidLanguage': ['Select a valid language.', '올바른 언어를 선택하세요.'],
  'host.scopeUnavailable': [
    'Could not determine the review scope.',
    '리뷰 범위를 확인할 수 없습니다.',
  ],
  'host.invalidApiUrl': ['Enter a valid server URL.', '올바른 서버 URL을 입력하세요.'],
  'host.noInstalledModels': [
    'No models are installed on the server.',
    '서버에 설치된 모델이 없습니다.',
  ],
  'host.modelsLoaded': ['Loaded {count} models.', '{count}개 모델을 불러왔습니다.'],
  'host.modelsHttpError': [
    'Could not load the model list. (HTTP {status})',
    '모델 목록을 불러오지 못했습니다. (HTTP {status})',
  ],
  'host.serverConnectionError': [
    'Could not connect to the server: {url}',
    '서버에 연결할 수 없습니다: {url}',
  ],
  'host.reviewWorkspace': ['Select a workspace to review.', '리뷰할 워크스페이스를 선택하세요.'],
  'host.selectScope': ['Select a review scope.', '리뷰 범위를 선택하세요.'],
  'host.branchModeRequired': [
    'Branch reviews require a base branch.',
    'branch 리뷰에는 기준 브랜치가 필요합니다.',
  ],
  'host.preparing': ['Preparing the review...', '리뷰를 준비하는 중...'],
  'host.preparingEditedReview': [
    'Preparing a review of edited files...',
    '수정한 파일의 재검토를 준비하는 중...',
  ],
  'host.noEditedIssues': [
    'There are no edited review issues to check.',
    '재검토할 수정된 이슈가 없습니다.',
  ],
  'host.saveEditedFailed': [
    'Could not save {file} before reviewing it.',
    '재검토 전에 {file} 파일을 저장하지 못했습니다.',
  ],
  'host.cancelled': ['Review cancelled.', '리뷰를 취소했습니다.'],
  'host.approve': ['Approve', '승인'],
  'host.comment': ['Needs review', '확인 필요'],
  'host.requestChanges': ['Changes requested', '수정 필요'],
  'host.branchChanges': ['Changes from {branch}', '{branch} 기준 변경량'],
  'host.stagedChanges': ['Staged changes', 'Staged changes 변경량'],
  'host.workingChanges': ['Working tree changes', 'Working tree 변경량'],
} as const;

export type MessageKey = keyof typeof messages;

let activeLocale: Locale = 'en';

export function parseLocale(language: string): Locale {
  return language.toLowerCase().startsWith('ko') ? 'ko-KR' : 'en';
}

export function parseLanguagePreference(value: unknown): LanguagePreference | undefined {
  return value === 'auto' || value === 'en' || value === 'ko-KR' ? value : undefined;
}

export function resolveLocale(
  preference: LanguagePreference,
  vscodeLanguage: string,
  vscodeNlsConfig?: string,
): Locale {
  if (preference !== 'auto') return preference;

  const nlsLanguage = parseNlsLanguage(vscodeNlsConfig);
  return [vscodeLanguage, nlsLanguage].some(
    (language) => language !== undefined && parseLocale(language) === 'ko-KR',
  )
    ? 'ko-KR'
    : 'en';
}

function parseNlsLanguage(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  try {
    const config = JSON.parse(value) as { locale?: unknown };
    return typeof config.locale === 'string' ? config.locale : undefined;
  } catch {
    return undefined;
  }
}

export function setLocale(locale: Locale): void {
  activeLocale = locale;
}

export function getLocale(): Locale {
  return activeLocale;
}

export function t(key: MessageKey, values: Record<string, string | number> = {}): string {
  const index = activeLocale === 'ko-KR' ? 1 : 0;
  return messages[key][index].replace(/\{([^{}]+)\}/g, (match, name: string) =>
    Object.hasOwn(values, name) ? String(values[name]) : match,
  );
}
