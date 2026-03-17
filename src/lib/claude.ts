import type { ParsedReport } from "../types/report";
import { SYSTEM_PROMPT, SYSTEM_PROMPT_BITBUCKET } from "./constants";
import { loadSettings } from "./settings";

const PROXY_BASE = "http://localhost:3001/api";

const callAnthropic = async (
  inputText: string,
  apiKey: string,
  model: string,
  systemPrompt: string,
) => {
  const response = await fetch(`${PROXY_BASE}/anthropic`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      model,
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: "user", content: inputText }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic API 오류: ${response.status} - ${err}`);
  }

  const result = await response.json();
  return result.content
    .filter((b: { type: string }) => b.type === "text")
    .map((b: { text: string }) => b.text)
    .join("");
};

const callOpenAI = async (
  inputText: string,
  apiKey: string,
  model: string,
  systemPrompt: string,
) => {
  const response = await fetch(`${PROXY_BASE}/openai`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      model,
      max_tokens: 1000,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: inputText },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API 오류: ${response.status} - ${err}`);
  }

  const result = await response.json();
  return result.choices[0].message.content;
};

const callGemini = async (
  inputText: string,
  apiKey: string,
  model: string,
  systemPrompt: string,
) => {
  const response = await fetch(`${PROXY_BASE}/gemini`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      model,
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: "user", parts: [{ text: inputText }] }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API 오류: ${response.status} - ${err}`);
  }

  const result = await response.json();
  return result.candidates[0].content.parts[0].text;
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

  let text: string;

  if (provider === "openai") {
    text = await callOpenAI(inputText, apiKey, model, systemPrompt);
  } else if (provider === "gemini") {
    text = await callGemini(inputText, apiKey, model, systemPrompt);
  } else {
    text = await callAnthropic(inputText, apiKey, model, systemPrompt);
  }

  const cleaned = text.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
};
