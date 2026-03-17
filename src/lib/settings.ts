export type Provider = 'anthropic' | 'openai' | 'gemini';

export interface ProviderConfig {
  id: Provider;
  name: string;
  models: { id: string; name: string }[];
}

export const PROVIDERS: ProviderConfig[] = [
  {
    id: 'anthropic',
    name: 'Anthropic (Claude)',
    models: [
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4' },
      { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5' },
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI (GPT)',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
    ],
  },
  {
    id: 'gemini',
    name: 'Google (Gemini)',
    models: [
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
    ],
  },
];

export interface GitSettings {
  repoPaths: string[];   // 로컬 레포 절대 경로들
  authorName: string;    // git log --author 필터용
}

export interface AppSettings {
  provider: Provider;
  model: string;
  apiKey: string;
  userName: string;
  git: GitSettings;
}

const STORAGE_KEY = 'weekly-report-settings';

const DEFAULTS: AppSettings = {
  provider: 'anthropic',
  model: 'claude-sonnet-4-20250514',
  apiKey: '',
  userName: '',
  git: {
    repoPaths: [],
    authorName: '',
  },
};

export const loadSettings = (): AppSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
};

export const saveSettings = (settings: AppSettings): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
};
