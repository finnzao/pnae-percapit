import { useState, useCallback } from 'react';

interface UseLoadingOptions<T = unknown> {
  initialLoading?: boolean;
  onError?: (error: Error) => void;
  onSuccess?: (data?: T) => void;
}

interface LoadingState {
  isLoading: boolean;
  error: string | null;
  hasError: boolean;
}

export function useLoading<T = unknown>(options: UseLoadingOptions<T> = {}) {
  const { initialLoading = false, onError, onSuccess } = options;
  
  const [state, setState] = useState<LoadingState>({
    isLoading: initialLoading,
    error: null,
    hasError: false
  });

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({
      ...prev,
      isLoading: loading,
      error: loading ? null : prev.error, // Limpa erro ao iniciar nova operação
      hasError: loading ? false : prev.hasError
    }));
  }, []);

  const setError = useCallback((error: string | Error | null) => {
    const errorMessage = error instanceof Error ? error.message : error;
    setState(prev => ({
      ...prev,
      isLoading: false,
      error: errorMessage,
      hasError: !!errorMessage
    }));
    
    if (error && onError) {
      onError(error instanceof Error ? error : new Error(errorMessage || 'Unknown error'));
    }
  }, [onError]);

  const setSuccess = useCallback((data?: T) => {
    setState(prev => ({
      ...prev,
      isLoading: false,
      error: null,
      hasError: false
    }));
    
    if (onSuccess) {
      onSuccess(data);
    }
  }, [onSuccess]);

  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
      hasError: false
    }));
  }, []);

  const execute = useCallback(async <R = T>(
    asyncFunction: () => Promise<R>,
    showLoading: boolean = true
  ): Promise<R | null> => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      
      const result = await asyncFunction();
      setSuccess(result as T);
      return result;
    } catch (error) {
      setError(error as Error);
      return null;
    }
  }, [setLoading, setSuccess, setError]);

  return {
    // Estados
    isLoading: state.isLoading,
    error: state.error,
    hasError: state.hasError,
    
    // Ações
    setLoading,
    setError,
    setSuccess,
    clearError,
    execute
  };
}