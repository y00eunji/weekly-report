import { useState, useCallback } from 'react';
import type { FullReportData, Phase } from '../types/report';
import { parseWithAI } from '../lib/claude';
import { generatePptx } from '../lib/pptx';

export const useReportGenerator = () => {
  const [phase, setPhase] = useState<Phase>('idle');
  const [parsedData, setParsedData] = useState<FullReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const parse = useCallback(async (text: string, name: string, date: string, useBitbucketPrompt = false) => {
    setPhase('parsing');
    setError(null);
    try {
      const result = await parseWithAI(text, useBitbucketPrompt);
      const fullData: FullReportData = { ...result, name, date };
      setParsedData(fullData);
      setPhase('preview');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPhase('error');
    }
  }, []);

  const generate = useCallback(async () => {
    if (!parsedData) return;
    setPhase('generating');
    try {
      const name = await generatePptx(parsedData);
      setFileName(name);
      setPhase('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPhase('error');
    }
  }, [parsedData]);

  const loadData = useCallback((data: FullReportData) => {
    setParsedData(data);
    setPhase('preview');
    setError(null);
    setFileName(null);
  }, []);

  const reset = useCallback(() => {
    setPhase('idle');
    setParsedData(null);
    setError(null);
    setFileName(null);
  }, []);

  return { phase, parsedData, setParsedData, error, setError, fileName, parse, generate, loadData, reset };
};
