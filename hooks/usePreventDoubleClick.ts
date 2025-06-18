/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback, useRef } from 'react';

interface UsePreventDoubleClickOptions {
  delay?: number; // Tempo mínimo entre cliques em ms
  onError?: (error: Error) => void;
  onSuccess?: () => void;
}

export function usePreventDoubleClick(
  callback: (...args: any[]) => Promise<any>,
  options: UsePreventDoubleClickOptions = {}
) {
  const { delay = 1000, onError, onSuccess } = options;
  const [isLoading, setIsLoading] = useState(false);
  const lastClickTime = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const handleClick = useCallback(async (...args: any[]) => {
    const now = Date.now();
    
    // Verifica se passou tempo suficiente desde o último clique
    if (now - lastClickTime.current < delay) {
      console.warn('Clique ignorado: muito rápido');
      return;
    }

    // Verifica se já está processando
    if (isLoading) {
      console.warn('Clique ignorado: ainda processando');
      return;
    }

    // Limpa timeout anterior se existir
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    lastClickTime.current = now;
    setIsLoading(true);

    try {
      const result = await callback(...args);
      if (onSuccess) {
        onSuccess();
      }
      return result;
    } catch (error) {
      if (onError) {
        onError(error as Error);
      } else {
        throw error;
      }
    } finally {
      // Adiciona um pequeno delay antes de permitir novo clique
      timeoutRef.current = setTimeout(() => {
        setIsLoading(false);
      }, 300);
    }
  }, [callback, delay, isLoading, onError, onSuccess]);

  // Cleanup do timeout quando o componente for desmontado
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return {
    handleClick,
    isLoading,
    cleanup
  };
}