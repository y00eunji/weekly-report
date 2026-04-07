import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export async function postToProxy<T>(
  url: string,
  payload: object,
  connectionError: string,
  failureLabel: string,
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error(connectionError);
  }
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`${failureLabel} 커밋 수집 실패: ${res.status} - ${err}`);
  }
  return res.json();
}
