import { useState, useCallback } from 'react';
import type { FullReportData, SavedReport } from '../types/report';
import { deepClone } from '../lib/utils';

const STORAGE_KEY = 'weekly-report-history';
const MAX_HISTORY = 50;

const loadHistory = (): SavedReport[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const persistHistory = (reports: SavedReport[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
};

export const useReportHistory = () => {
  const [history, setHistory] = useState<SavedReport[]>(loadHistory);

  const save = useCallback((data: FullReportData): SavedReport => {
    const now = new Date().toISOString();
    const report: SavedReport = {
      id: crypto.randomUUID(),
      data: deepClone(data),
      createdAt: now,
      updatedAt: now,
    };
    setHistory((prev) => {
      const next = [report, ...prev].slice(0, MAX_HISTORY);
      persistHistory(next);
      return next;
    });
    return report;
  }, []);

  const update = useCallback((id: string, data: FullReportData) => {
    setHistory((prev) => {
      const next = prev.map((r) =>
        r.id === id
          ? { ...r, data: deepClone(data), updatedAt: new Date().toISOString() }
          : r,
      );
      persistHistory(next);
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setHistory((prev) => {
      const next = prev.filter((r) => r.id !== id);
      persistHistory(next);
      return next;
    });
  }, []);

  return { history, save, update, remove };
};
