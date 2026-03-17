import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Save, CheckCircle, FolderOpen, GitBranch, Plus, X } from 'lucide-react';
import { useDarkMode } from '../hooks/useDarkMode';
import { ThemeToggle } from './ThemeToggle';
import {
  type AppSettings,
  type Provider,
  type GitSource,
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
  const [newRepoSlug, setNewRepoSlug] = useState('');
  const [pickingFolder, setPickingFolder] = useState(false);
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

                {/* Source Toggle */}
                <div className="flex gap-1 mb-4 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <button
                    onClick={() => {
                      setSettings((prev) => ({ ...prev, gitSource: 'local' }));
                      setSaved(false);
                    }}
                    className={`flex-1 py-2 rounded-md text-xs font-semibold cursor-pointer border-none transition-all ${
                      settings.gitSource === 'local'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                        : 'bg-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    로컬 Git
                  </button>
                  <button
                    onClick={() => {
                      setSettings((prev) => ({ ...prev, gitSource: 'bitbucket' }));
                      setSaved(false);
                    }}
                    className={`flex-1 py-2 rounded-md text-xs font-semibold cursor-pointer border-none transition-all ${
                      settings.gitSource === 'bitbucket'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                        : 'bg-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    Bitbucket
                  </button>
                </div>

                {/* Local Git Settings */}
                {settings.gitSource === 'local' && (
                  <div className="space-y-3">
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed">
                      로컬 Git 레포 경로를 등록하면 커밋 내역을 자동으로 수집합니다
                    </p>
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

                      <button
                        onClick={async () => {
                          setPickingFolder(true);
                          try {
                            const res = await fetch('/api/pick-folder', { method: 'POST' });
                            const data = await res.json();
                            if (data.path && !data.cancelled) {
                              if (!data.isGitRepo) {
                                alert('선택한 폴더에 .git이 없습니다. Git 레포지토리 폴더를 선택해주세요.');
                                return;
                              }
                              if (settings.git.repoPaths.includes(data.path)) {
                                alert('이미 추가된 경로입니다.');
                                return;
                              }
                              setSettings((prev) => ({
                                ...prev,
                                git: {
                                  ...prev.git,
                                  repoPaths: [...prev.git.repoPaths, data.path],
                                },
                              }));
                              setSaved(false);
                            }
                          } catch {
                            alert('폴더 선택에 실패했습니다.');
                          } finally {
                            setPickingFolder(false);
                          }
                        }}
                        disabled={pickingFolder}
                        className="w-full py-2.5 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-[13px] font-medium cursor-pointer hover:border-blue-400 hover:text-blue-500 dark:hover:border-blue-500 dark:hover:text-blue-400 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-wait"
                      >
                        <FolderOpen size={16} />
                        {pickingFolder ? '폴더 선택 중...' : '폴더 선택하여 추가'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Bitbucket Settings */}
                {settings.gitSource === 'bitbucket' && (
                  <div className="space-y-3">
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed">
                      Bitbucket App Password로 원격 레포의 커밋을 수집합니다.
                      로컬 서버 없이 배포 환경에서도 동작합니다.
                    </p>

                    <div>
                      <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">
                        이메일 (Atlassian 계정)
                      </label>
                      <input
                        value={settings.bitbucket.username}
                        onChange={(e) => {
                          setSettings((prev) => ({
                            ...prev,
                            bitbucket: { ...prev.bitbucket, username: e.target.value },
                          }));
                          setSaved(false);
                        }}
                        placeholder="ejyoo@autocrypt.io"
                        className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-[13px] text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 outline-none focus:border-primary transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">
                        워크스페이스
                      </label>
                      <input
                        value={settings.bitbucket.workspace}
                        onChange={(e) => {
                          setSettings((prev) => ({
                            ...prev,
                            bitbucket: { ...prev.bitbucket, workspace: e.target.value },
                          }));
                          setSaved(false);
                        }}
                        placeholder="my-workspace"
                        className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-[13px] text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 outline-none focus:border-primary transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">
                        API Token
                      </label>
                      <div className="relative">
                        <input
                          type={showKey ? 'text' : 'password'}
                          value={settings.bitbucket.apiToken}
                          onChange={(e) => {
                            setSettings((prev) => ({
                              ...prev,
                              bitbucket: { ...prev.bitbucket, apiToken: e.target.value },
                            }));
                            setSaved(false);
                          }}
                          placeholder="ATCTT3xFfGN0..."
                          className="w-full px-3 py-2.5 pr-10 border border-gray-200 dark:border-gray-700 rounded-lg text-[13px] text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 outline-none focus:border-primary transition-colors font-mono"
                        />
                        <button
                          onClick={() => setShowKey((prev) => !prev)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 bg-transparent border-none cursor-pointer p-0.5"
                        >
                          {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                        id.atlassian.com → 보안 → API 토큰에서 생성
                      </p>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">
                        커밋 작성자 필터 (선택)
                      </label>
                      <input
                        value={settings.bitbucket.authorName}
                        onChange={(e) => {
                          setSettings((prev) => ({
                            ...prev,
                            bitbucket: { ...prev.bitbucket, authorName: e.target.value },
                          }));
                          setSaved(false);
                        }}
                        placeholder="홍길동 또는 gildong@company.com"
                        className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-[13px] text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 outline-none focus:border-primary transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">
                        브랜치
                      </label>
                      <input
                        value={settings.bitbucket.branch}
                        onChange={(e) => {
                          setSettings((prev) => ({
                            ...prev,
                            bitbucket: { ...prev.bitbucket, branch: e.target.value },
                          }));
                          setSaved(false);
                        }}
                        placeholder="develop"
                        className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-[13px] text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 outline-none focus:border-primary transition-colors"
                      />
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                        비워두면 전체 브랜치의 커밋을 수집합니다
                      </p>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                        레포지토리 (slug)
                      </label>

                      {settings.bitbucket.repoSlugs.length > 0 && (
                        <div className="space-y-1.5 mb-2">
                          {settings.bitbucket.repoSlugs.map((slug, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                            >
                              <span className="flex-1 text-[12px] text-gray-700 dark:text-gray-300 font-mono truncate">
                                <span className="text-gray-400 dark:text-gray-500">{settings.bitbucket.workspace}/</span>{slug}
                              </span>
                              <button
                                onClick={() => {
                                  setSettings((prev) => ({
                                    ...prev,
                                    bitbucket: {
                                      ...prev.bitbucket,
                                      repoSlugs: prev.bitbucket.repoSlugs.filter((_, idx) => idx !== i),
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

                      <button
                        onClick={async () => {
                          setPickingFolder(true);
                          try {
                            const res = await fetch('/api/pick-repo', { method: 'POST' });
                            const data = await res.json();
                            if (data.cancelled) return;
                            if (data.error) {
                              alert(data.error);
                              return;
                            }
                            if (data.slug) {
                              if (settings.bitbucket.repoSlugs.includes(data.slug)) {
                                alert('이미 추가된 레포지토리입니다.');
                                return;
                              }
                              setSettings((prev) => ({
                                ...prev,
                                bitbucket: {
                                  ...prev.bitbucket,
                                  repoSlugs: [...prev.bitbucket.repoSlugs, data.slug],
                                  // workspace가 비어있으면 자동 채우기
                                  ...(data.workspace && !prev.bitbucket.workspace ? { workspace: data.workspace } : {}),
                                },
                              }));
                              setSaved(false);
                            }
                          } catch {
                            alert('폴더 선택에 실패했습니다.');
                          } finally {
                            setPickingFolder(false);
                          }
                        }}
                        disabled={pickingFolder}
                        className="w-full py-2.5 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-[13px] font-medium cursor-pointer hover:border-blue-400 hover:text-blue-500 dark:hover:border-blue-500 dark:hover:text-blue-400 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-wait"
                      >
                        <FolderOpen size={16} />
                        {pickingFolder ? '폴더 선택 중...' : '로컬 폴더에서 레포 추가'}
                      </button>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1.5">
                        Git 레포 폴더를 선택하면 remote URL에서 slug를 자동 추출합니다
                      </p>
                    </div>
                  </div>
                )}
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
