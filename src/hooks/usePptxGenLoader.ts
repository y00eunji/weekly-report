import { useState, useEffect } from 'react';
import { PPTXGEN_CDN } from '../lib/constants';

export const usePptxGenLoader = () => {
  const [loaded, setLoaded] = useState(!!window.PptxGenJS);

  useEffect(() => {
    // 이미 다른 인스턴스가 script를 추가 중인지 확인
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${PPTXGEN_CDN}"]`,
    );

    if (existing) {
      // 이미 로딩 중이면 load 이벤트 대기
      const onLoad = () => setLoaded(true);
      existing.addEventListener('load', onLoad);
      return () => existing.removeEventListener('load', onLoad);
    }

    const script = document.createElement('script');
    script.src = PPTXGEN_CDN;
    script.onload = () => setLoaded(true);
    script.onerror = () => console.error('pptxgenjs 로딩 실패');
    document.head.appendChild(script);
    // cleanup에서 script를 제거하지 않음 (StrictMode remount 대응)
  }, []);

  return loaded;
};
