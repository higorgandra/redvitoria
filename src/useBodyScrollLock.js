import { useEffect } from 'react';

// O Safari do iOS ignora `overflow: hidden` no body: o fundo continua rolando
// atrás de modais e menus. A única técnica confiável é fixar o body na posição
// atual e devolver o scroll ao liberar.
export const useBodyScrollLock = (isLocked) => {
  useEffect(() => {
    if (!isLocked) return undefined;

    const { body } = document;
    const scrollY = window.scrollY;
    const previousStyles = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow,
    };

    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    body.style.overflow = 'hidden';

    return () => {
      Object.assign(body.style, previousStyles);
      // `position: fixed` zera o scroll do documento; restauramos na saída.
      window.scrollTo(0, scrollY);
    };
  }, [isLocked]);
};
