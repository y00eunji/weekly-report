import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronDown, ChevronUp, Download, FileText, GitBranch, Keyboard, RotateCcw, Save, Settings, Sparkles } from 'lucide-react';
import { usePptxGenLoader } from './hooks/usePptxGenLoader';
import { useReportGenerator } from './hooks/useReportGenerator';
import { useReportHistory } from './hooks/useReportHistory';
import { useDarkMode } from './hooks/useDarkMode';
import { ThemeToggle } from './components/ThemeToggle';
import { PreviewPanel } from './components/PreviewPanel';
import { HistoryPanel } from './components/HistoryPanel';
import { PulseLoader } from './components/PulseLoader';
import { SAMPLE_INPUT } from './lib/constants';
import { loadSettings } from './lib/settings';
import { fetchLocalGitData, formatGitDataForAI } from './lib/git';
import type { SavedReport } from './types/report';

// ISO 형식 (YYYY-MM-DD) - input[type=date]용
const toISO = (d: Date) => d.toISOString().substring(0, 10);

// 스프린트 기간: 저번 주 수요일 ~ 이번 주 화요일
const getSprintRange = () => {
  const now = new Date();
  const day = now.getDay(); // 0=일, 1=월, ..., 6=토

  // 이번 주 화요일 구하기 (day=0이면 -5, day=1이면 +1, day=2이면 0, day=3이면 -1, ...)
  const tuesday = new Date(now);
  const diffToTuesday = day === 0 ? -5 : 2 - day;
  tuesday.setDate(now.getDate() + diffToTuesday);

  // 저번 주 수요일 = 이번 주 화요일 - 6일
  const wednesday = new Date(tuesday);
  wednesday.setDate(tuesday.getDate() - 6);

  return { from: toISO(wednesday), to: toISO(tuesday) };
};

// 보고서 표시용 날짜 (YYYY/M/D)
const toDisplayDate = (isoStr: string) => {
  const [y, m, d] = isoStr.split('-');
  return `${y}/${Number(m)}/${Number(d)}`;
};

export default function App() {
  const navigate = useNavigate();
  const pptxReady = usePptxGenLoader();
  const { dark, toggle } = useDarkMode();
  const {
    phase, parsedData, setParsedData, error, setError, fileName,
    parse, generate, loadData, reset,
  } = useReportGenerator();
  const { history, save: saveReport, update: updateReport, remove: removeReport } = useReportHistory();

  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const settings = loadSettings();
  const hasApiKey = !!settings.apiKey;
  const hasGit = !!(settings.git.repoPaths.length && settings.git.authorName);

  type InputMode = 'manual' | 'git';
  const [mode, setMode] = useState<InputMode>(hasGit ? 'git' : 'manual');
  const weekRange = getSprintRange();
  const [name, setName] = useState(settings.userName || '');
  const [dateFrom, setDateFrom] = useState(weekRange.from);
  const [dateTo, setDateTo] = useState(weekRange.to);
  const [input, setInput] = useState('');
  const [fetching, setFetching] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleFetchGit = async () => {
    setFetching(true);
    setError(null);
    try {
      const data = await fetchLocalGitData(dateFrom, dateTo);
      const text = formatGitDataForAI(data);
      setInput(text);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setFetching(false);
    }
  };

  // 설정에서 이름이 바뀌면 반영
  useEffect(() => {
    const s = loadSettings();
    if (s.userName && !name) setName(s.userName);
  }, [name]);

  const handleSubmit = () => {
    if (!input.trim()) return;
    if (!hasApiKey) {
      navigate('/settings');
      return;
    }
    parse(input, name, toDisplayDate(dateTo), mode === 'git');
  };

  const handleUpdate = useCallback(
    (sectionKey: string, groupIdx: number, field: string, value: string | { itemIdx: number; field: string; value: string }) => {
      setParsedData((prev) => {
        if (!prev) return prev;
        const next = JSON.parse(JSON.stringify(prev));
        if (field === 'group_title') {
          next[sectionKey][groupIdx].group_title = value;
        } else if (field === 'item' && typeof value === 'object') {
          const { itemIdx, field: f, value: v } = value;
          next[sectionKey][groupIdx].items[itemIdx][f] = v;
        } else if (field === 'add_group') {
          next[sectionKey].push({ group_title: '새 그룹', items: [{ text: '내용을 입력하세요', status: '진행중' }] });
        } else if (field === 'add_item') {
          next[sectionKey][groupIdx].items.push({ text: '내용을 입력하세요', status: '진행중' });
        }
        return next;
      });
    },
    [setParsedData],
  );

  const handleReorder = useCallback(
    (sectionKey: string, fromIndex: number, toIndex: number) => {
      setParsedData((prev) => {
        if (!prev) return prev;
        const next = JSON.parse(JSON.stringify(prev));
        const arr = next[sectionKey];
        const [moved] = arr.splice(fromIndex, 1);
        arr.splice(toIndex, 0, moved);
        return next;
      });
    },
    [setParsedData],
  );

  const handleReorderItems = useCallback(
    (sectionKey: string, groupIdx: number, fromIndex: number, toIndex: number) => {
      setParsedData((prev) => {
        if (!prev) return prev;
        const next = JSON.parse(JSON.stringify(prev));
        const items = next[sectionKey][groupIdx].items;
        const [moved] = items.splice(fromIndex, 1);
        items.splice(toIndex, 0, moved);
        return next;
      });
    },
    [setParsedData],
  );

  const handleSaveReport = () => {
    if (!parsedData) return;
    if (activeReportId) {
      updateReport(activeReportId, parsedData);
    } else {
      const saved = saveReport(parsedData);
      setActiveReportId(saved.id);
    }
  };

  const handleLoadReport = (report: SavedReport) => {
    loadData(JSON.parse(JSON.stringify(report.data)));
    setName(report.data.name);
    setActiveReportId(report.id);
    setHistoryOpen(false);
  };

  const handleResetWithCleanup = () => {
    reset();
    setActiveReportId(null);
  };

  const fillSample = () => {
    setInput(SAMPLE_INPUT);
    textareaRef.current?.focus();
  };

  const isInputPhase = phase === 'idle' || phase === 'error';
  const isPreviewPhase = phase === 'preview';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-violet-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 font-sans transition-colors duration-300">
      {/* Top-right buttons */}
      <div className="fixed top-5 right-5 flex items-center gap-2 z-10">
        <button
          onClick={() => navigate('/settings')}
          className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center cursor-pointer shadow-sm hover:shadow-md transition-shadow"
          aria-label="Settings"
        >
          <Settings size={18} className="text-gray-500 dark:text-gray-400" />
        </button>
        <ThemeToggle dark={dark} toggle={toggle} />
      </div>

      <div className="px-4 py-8 sm:py-12 flex justify-center">
        <div className="w-full max-w-[960px]">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2.5 mb-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white text-lg font-extrabold">
                W
              </div>
              <span className="text-[22px] font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
                주간보고 생성기
              </span>
            </div>
            <p className="text-[13px] text-gray-400 dark:text-gray-500 mt-1 leading-relaxed">
              작업 내용을 자유롭게 입력하면 AI가 자동으로 그룹핑하여 PPTX를 생성합니다
            </p>
          </div>

          {/* API Key Warning */}
          {!hasApiKey && isInputPhase && (
            <button
              onClick={() => navigate('/settings')}
              className="w-full mb-4 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 text-amber-700 dark:text-amber-400 text-xs font-medium cursor-pointer text-left hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-colors"
            >
              API 키가 설정되지 않았습니다. 여기를 클릭하여 설정해주세요.
            </button>
          )}

          {/* Main Card */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_8px_24px_rgba(0,0,0,0.3)] overflow-hidden border border-transparent dark:border-gray-800">
            {/* Name */}
            <div className="px-6 pt-5">
              <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1 tracking-wider uppercase">
                이름
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!isInputPhase}
                placeholder="홍길동"
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-[13px] text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 outline-none focus:border-primary transition-colors disabled:opacity-50"
              />
            </div>

            {/* Input Phase */}
            {isInputPhase && (
              <div className="px-6 py-4">
                {/* Mode Tabs */}
                <div className="flex gap-1 mb-4 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <button
                    onClick={() => setMode('manual')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-semibold cursor-pointer border-none transition-all ${
                      mode === 'manual'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                        : 'bg-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <Keyboard size={14} />
                    직접 입력
                  </button>
                  <button
                    onClick={() => setMode('git')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-semibold cursor-pointer border-none transition-all ${
                      mode === 'git'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                        : 'bg-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <GitBranch size={14} />
                    Git 자동 수집
                  </button>
                </div>

                {/* Git Mode */}
                {mode === 'git' && (
                  <div className="mb-3">
                    {!hasGit ? (
                      <button
                        onClick={() => navigate('/settings')}
                        className="w-full px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 text-blue-700 dark:text-blue-400 text-xs font-medium cursor-pointer text-left hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors"
                      >
                        Git 레포 경로 설정이 필요합니다. 여기를 클릭하여 설정해주세요.
                      </button>
                    ) : (
                      <div className="space-y-3">
                        {/* 기간 선택 */}
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1 tracking-wider uppercase">
                            기간
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="date"
                              value={dateFrom}
                              onChange={(e) => setDateFrom(e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-[13px] text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 outline-none focus:border-primary transition-colors"
                            />
                            <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">~</span>
                            <input
                              type="date"
                              value={dateTo}
                              onChange={(e) => setDateTo(e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-[13px] text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 outline-none focus:border-primary transition-colors"
                            />
                          </div>
                        </div>
                        <button
                          onClick={handleFetchGit}
                          disabled={fetching}
                          className="w-full py-2.5 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs font-semibold cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          <GitBranch size={14} />
                          {fetching ? '수집 중...' : '커밋 수집하기'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Text Area (both modes) */}
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 tracking-wider uppercase">
                    {mode === 'git' ? '수집된 내용 (편집 가능)' : '작업 내용'}
                  </label>
                  {mode === 'manual' && (
                    <button
                      onClick={fillSample}
                      className="border-none bg-transparent text-primary text-[11px] font-semibold cursor-pointer px-1.5 py-0.5 rounded hover:bg-primary/10 transition-colors"
                    >
                      예시 채우기
                    </button>
                  )}
                </div>
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={mode === 'git'
                    ? '위 버튼을 눌러 커밋을 수집하거나, 직접 추가 내용을 입력할 수 있습니다'
                    : `이번 주 작업 내용을 자유롭게 입력하세요...\n\n예) 수입금 관리 페이지 버그 수정\n     기사 목록 검색 기능 개선 완료\n     차주: QA 대응 진행중`}
                  rows={10}
                  className="w-full resize-y border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-3 text-[13px] leading-7 text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 transition-colors focus:border-primary outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600"
                />
                {error && (
                  <div className="mt-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-xs">
                    {error}
                  </div>
                )}
                <button
                  onClick={handleSubmit}
                  disabled={!input.trim() || !pptxReady}
                  className="mt-3 w-full py-3 rounded-xl border-none text-white text-sm font-bold tracking-wide transition-all duration-200 flex items-center justify-center gap-2 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed enabled:bg-gradient-to-r enabled:from-primary enabled:to-primary-dark enabled:cursor-pointer enabled:hover:shadow-lg enabled:hover:shadow-primary/20"
                >
                  {pptxReady ? (
                    <>
                      <Sparkles size={16} />
                      AI로 분석하기
                    </>
                  ) : (
                    '라이브러리 로딩 중...'
                  )}
                </button>
              </div>
            )}

            {/* Parsing Phase */}
            {phase === 'parsing' && (
              <PulseLoader text="AI가 작업 내용을 분석하고 있어요..." />
            )}

            {/* Preview Phase */}
            {isPreviewPhase && parsedData && (
              <div className="px-6 pt-4 pb-6">
                <div className="flex justify-between items-center mb-3.5">
                  <span className="text-[13px] font-bold text-gray-900 dark:text-gray-100">
                    미리보기
                    <span className="text-[11px] font-normal text-gray-400 ml-2">
                      클릭하여 수정 가능
                    </span>
                  </span>
                  <button
                    onClick={handleResetWithCleanup}
                    className="flex items-center gap-1.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs font-semibold cursor-pointer px-3 py-1 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <RotateCcw size={12} />
                    다시 입력
                  </button>
                </div>

                <PreviewPanel
                  data={parsedData}
                  onUpdate={handleUpdate}
                  onReorder={handleReorder}
                  onReorderItems={handleReorderItems}
                />

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={handleSaveReport}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm font-bold cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Save size={16} />
                    {activeReportId ? '업데이트' : '저장'}
                  </button>
                  <button
                    onClick={generate}
                    className="flex-1 py-3 rounded-xl border-none bg-gradient-to-r from-primary to-primary-dark text-white text-sm font-bold cursor-pointer tracking-wide hover:shadow-lg hover:shadow-primary/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Download size={16} />
                    PPTX 다운로드
                  </button>
                </div>
              </div>
            )}

            {/* Generating Phase */}
            {phase === 'generating' && (
              <PulseLoader text="PPTX를 생성하고 있어요..." />
            )}

            {/* Done Phase */}
            {phase === 'done' && (
              <div className="px-6 py-8 text-center">
                <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                  <Check size={28} className="text-green-600 dark:text-green-400" />
                </div>
                <div className="text-base font-bold text-gray-900 dark:text-gray-100 mb-1">
                  다운로드 완료!
                </div>
                <div className="text-xs text-gray-400 mb-5 flex items-center justify-center gap-1">
                  <FileText size={12} />
                  {fileName}
                </div>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={generate}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs font-semibold cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Download size={14} />
                    다시 다운로드
                  </button>
                  <button
                    onClick={handleResetWithCleanup}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-lg border-none bg-gradient-to-r from-primary to-primary-dark text-white text-xs font-semibold cursor-pointer hover:shadow-lg hover:shadow-primary/20 transition-all"
                  >
                    <Sparkles size={14} />
                    새 보고서 작성
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* History Section */}
          {isInputPhase && history.length > 0 && (
            <div className="mt-4 bg-white dark:bg-gray-900 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_8px_24px_rgba(0,0,0,0.3)] overflow-hidden border border-transparent dark:border-gray-800">
              <button
                onClick={() => setHistoryOpen((v) => !v)}
                className="w-full px-6 py-3 flex items-center justify-between border-none bg-transparent cursor-pointer"
              >
                <span className="text-[13px] font-bold text-gray-900 dark:text-gray-100">
                  이전 보고서
                  <span className="text-[11px] font-normal text-gray-400 ml-2">
                    {history.length}건
                  </span>
                </span>
                {historyOpen ? (
                  <ChevronUp size={16} className="text-gray-400" />
                ) : (
                  <ChevronDown size={16} className="text-gray-400" />
                )}
              </button>
              {historyOpen && (
                <div className="px-6 pb-4">
                  <HistoryPanel
                    history={history}
                    onLoad={handleLoadReport}
                    onDelete={removeReport}
                  />
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="text-center mt-5 text-[11px] text-gray-400 dark:text-gray-600">
            Powered by AI + pptxgenjs &middot; 브라우저에서 모두 처리됩니다
          </div>
        </div>
      </div>
    </div>
  );
}
