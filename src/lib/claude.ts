import type { ParsedReport } from "../types/report";
import { SYSTEM_PROMPT, SYSTEM_PROMPT_BITBUCKET } from "./constants";
import { loadSettings } from "./settings";

const PROXY_BASE = "/api";

type ProviderConfig = {
  url: string;
  buildBody: (inputText: string, model: string, systemPrompt: string) => object;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  extractText: (result: any) => string;
  errorLabel: string;
};

const PROVIDER_CONFIGS: Record<string, ProviderConfig> = {
  anthropic: {
    url: `${PROXY_BASE}/anthropic`,
    buildBody: (inputText, model, systemPrompt) => ({
      model,
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: "user", content: inputText }],
    }),
    extractText: (result) =>
      result.content
        .filter((b: { type: string }) => b.type === "text")
        .map((b: { text: string }) => b.text)
        .join(""),
    errorLabel: "Anthropic",
  },
  openai: {
    url: `${PROXY_BASE}/openai`,
    buildBody: (inputText, model, systemPrompt) => ({
      model,
      max_tokens: 1000,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: inputText },
      ],
    }),
    extractText: (result) => result.choices[0].message.content,
    errorLabel: "OpenAI",
  },
  gemini: {
    url: `${PROXY_BASE}/gemini`,
    buildBody: (inputText, model, systemPrompt) => ({
      model,
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: "user", parts: [{ text: inputText }] }],
    }),
    extractText: (result) => result.candidates[0].content.parts[0].text,
    errorLabel: "Gemini",
  },
};

const callLLMProvider = async (
  inputText: string,
  apiKey: string,
  model: string,
  systemPrompt: string,
  provider: string,
): Promise<string> => {
  const config = PROVIDER_CONFIGS[provider] ?? PROVIDER_CONFIGS.anthropic;

  const response = await fetch(config.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify(config.buildBody(inputText, model, systemPrompt)),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`${config.errorLabel} API 오류: ${response.status} - ${err}`);
  }

  const result = await response.json();
  return config.extractText(result);
};

export const parseWithAI = async (
  inputText: string,
  useBitbucketPrompt = false,
): Promise<ParsedReport> => {
  const { provider, model, apiKey } = loadSettings();
  const systemPrompt = useBitbucketPrompt
    ? SYSTEM_PROMPT_BITBUCKET
    : SYSTEM_PROMPT;

  if (!apiKey) {
    throw new Error(
      "API 키가 설정되지 않았습니다. 설정 페이지에서 API 키를 입력해주세요.",
    );
  }

  const text = await callLLMProvider(inputText, apiKey, model, systemPrompt, provider);
  const cleaned = text.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
};
