import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Save, CheckCircle, GitBranch, Plus, X } from 'lucide-react';
import { useDarkMode } from '../hooks/useDarkMode';
import { ThemeToggle } from './ThemeToggle';
import {
  type AppSettings,
  type Provider,
  PROVIDERS,
  loadSettings,
  saveSettings,
} from '../lib/settings';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { dark, toggle } = useDarkMode();
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [showKey, setShowKey] = useState(false);
  const [newRepoPath, setNewRepoPath] = useState('');
  const [saved, setSaved] = useState(false);

  const currentProvider = PROVIDERS.find((p) => p.id === settings.provider);

  // provider 목록에 없는 모델이면 첫 번째 모델로 보정 (렌더 시점에 파생, effect 내 setState 방지)
  const effectiveModel = useMemo(() => {
    if (!currentProvider || currentProvider.models.some((m) => m.id === settings.model)) {
      return settings.model;
    }
    return currentProvider.models[0].id;
  }, [currentProvider, settings.model]);

  const handleProviderChange = (provider: Provider) => {
    const nextProvider = PROVIDERS.find((p) => p.id === provider);
    setSettings((prev) => ({
      ...prev,
      provider,
      model: nextProvider ? nextProvider.models[0].id : prev.model,
    }));
    setSaved(false);
  };

  const handleSave = () => {
    saveSettings({ ...settings, model: effectiveModel });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-violet-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 font-sans transition-colors duration-300">
      <div className="fixed top-5 right-5 z-10">
        <ThemeToggle dark={dark} toggle={toggle} />
      </div>
      <div className="px-4 py-8 sm:py-12 flex justify-center">
        <div className="w-full max-w-[560px]">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors mb-4 bg-transparent border-none cursor-pointer"
            >
              <ArrowLeft size={16} />
              돌아가기
            </button>
            <h1 className="text-xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
              설정
            </h1>
            <p className="text-[13px] text-gray-400 dark:text-gray-500 mt-1">
              AI 제공자, 모델, API 키를 설정합니다
            </p>
          </div>

          {/* Card */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_8px_24px_rgba(0,0,0,0.3)] border border-transparent dark:border-gray-800 overflow-hidden">
            {/* User Name */}
            <div className="px-6 pt-6">
              <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5 tracking-wider uppercase">
                이름 (보고서에 표시)
              </label>
              <input
                value={settings.userName}
                onChange={(e) => {
                  setSettings((prev) => ({ ...prev, userName: e.target.value }));
                  setSaved(false);
                }}
                placeholder="홍길동"
                className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-[13px] text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 outline-none focus:border-primary transition-colors"
              />
            </div>

            {/* Provider Selection */}
            <div className="px-6 pt-5">
              <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-2 tracking-wider uppercase">
                AI 제공자
              </label>
              <div className="grid grid-cols-3 gap-2">
                {PROVIDERS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleProviderChange(p.id)}
                    className={`px-4 py-3 rounded-xl border text-sm font-semibold cursor-pointer transition-all ${
                      settings.provider === p.id
                        ? 'border-primary bg-primary/5 dark:bg-primary/10 text-primary'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Model Selection */}
            <div className="px-6 pt-5">
              <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5 tracking-wider uppercase">
                모델
              </label>
              <select
                value={effectiveModel}
                onChange={(e) => {
                  setSettings((prev) => ({ ...prev, model: e.target.value }));
                  setSaved(false);
                }}
                className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-[13px] text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 outline-none focus:border-primary transition-colors appearance-none cursor-pointer"
              >
                {currentProvider?.models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* API Key */}
            <div className="px-6 pt-5">
              <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5 tracking-wider uppercase">
                API 키
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={settings.apiKey}
                  onChange={(e) => {
                    setSettings((prev) => ({ ...prev, apiKey: e.target.value }));
                    setSaved(false);
                  }}
                  placeholder={
                    settings.provider === 'anthropic'
                      ? 'sk-ant-api03-...'
                      : settings.provider === 'gemini'
                        ? 'AIzaSy...'
                        : 'sk-...'
                  }
                  className="w-full px-3 py-2.5 pr-10 border border-gray-200 dark:border-gray-700 rounded-lg text-[13px] text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 outline-none focus:border-primary transition-colors font-mono"
                />
                <button
                  onClick={() => setShowKey((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 bg-transparent border-none cursor-pointer p-0.5"
                >
                  {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1.5">
                API 키는 브라우저의 localStorage에만 저장되며 서버에 저장되지 않습니다
              </p>
            </div>

            {/* Git Settings */}
            <div className="px-6 pt-6">
              <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
                <div className="flex items-center gap-2 mb-3">
                  <GitBranch size={16} className="text-blue-500" />
                  <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 tracking-wider uppercase">
                    Git 커밋 자동 수집
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-3 leading-relaxed">
                  로컬 Git 레포 경로를 등록하면 커밋 내역을 자동으로 수집합니다
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Git Author (커밋 작성자 이름 또는 이메일)
                    </label>
                    <input
                      value={settings.git.authorName}
                      onChange={(e) => {
                        setSettings((prev) => ({
                          ...prev,
                          git: { ...prev.git, authorName: e.target.value },
                        }));
                        setSaved(false);
                      }}
                      placeholder="홍길동 또는 gildong@company.com"
                      className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-[13px] text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 outline-none focus:border-primary transition-colors"
                    />
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                      git config user.name 또는 user.email 값과 일치해야 합니다
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                      레포 경로
                    </label>

                    {/* 등록된 레포 목록 */}
                    {settings.git.repoPaths.length > 0 && (
                      <div className="space-y-1.5 mb-2">
                        {settings.git.repoPaths.map((p, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                          >
                            <span className="flex-1 text-[12px] text-gray-700 dark:text-gray-300 font-mono truncate">
                              {p}
                            </span>
                            <button
                              onClick={() => {
                                setSettings((prev) => ({
                                  ...prev,
                                  git: {
                                    ...prev.git,
                                    repoPaths: prev.git.repoPaths.filter((_, idx) => idx !== i),
                                  },
                                }));
                                setSaved(false);
                              }}
                              className="text-gray-400 hover:text-red-500 bg-transparent border-none cursor-pointer p-0.5 shrink-0"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 새 경로 추가 */}
                    <div className="flex gap-2">
                      <input
                        value={newRepoPath}
                        onChange={(e) => setNewRepoPath(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newRepoPath.trim()) {
                            setSettings((prev) => ({
                              ...prev,
                              git: {
                                ...prev.git,
                                repoPaths: [...prev.git.repoPaths, newRepoPath.trim()],
                              },
                            }));
                            setNewRepoPath('');
                            setSaved(false);
                          }
                        }}
                        placeholder="~/projects/my-repo"
                        className="flex-1 px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-[13px] text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 outline-none focus:border-primary transition-colors font-mono"
                      />
                      <button
                        onClick={() => {
                          if (newRepoPath.trim()) {
                            setSettings((prev) => ({
                              ...prev,
                              git: {
                                ...prev.git,
                                repoPaths: [...prev.git.repoPaths, newRepoPath.trim()],
                              },
                            }));
                            setNewRepoPath('');
                            setSaved(false);
                          }
                        }}
                        className="px-3 py-2.5 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors shrink-0"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1.5">
                      ~/로 시작하면 홈 디렉토리 기준으로 자동 변환됩니다
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="px-6 py-6">
              <button
                onClick={handleSave}
                className={`w-full py-3 rounded-xl border-none text-white text-sm font-bold cursor-pointer tracking-wide transition-all flex items-center justify-center gap-2 ${
                  saved
                    ? 'bg-green-500'
                    : 'bg-gradient-to-r from-primary to-primary-dark hover:shadow-lg hover:shadow-primary/20'
                }`}
              >
                {saved ? (
                  <>
                    <CheckCircle size={16} />
                    저장 완료
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    저장
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="mt-5 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/20">
            <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
              <strong>Anthropic:</strong> console.anthropic.com 에서 API 키를 발급받을 수 있습니다.
              <br />
              <strong>OpenAI:</strong> platform.openai.com 에서 API 키를 발급받을 수 있습니다.
              <br />
              <strong>Gemini:</strong> aistudio.google.com 에서 API 키를 발급받을 수 있습니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
