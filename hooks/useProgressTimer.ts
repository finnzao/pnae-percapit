// hooks/useProgressTimer.ts
import { useState, useCallback, useRef, useEffect } from 'react';

interface ProgressStep {
    name: string;
    duration: number;
    message: string;
}

interface UseProgressTimerOptions {
    autoStart?: boolean;
    onComplete?: () => void;
    onStepChange?: (step: ProgressStep, progress: number) => void;
}

interface UseProgressTimerReturn {
    progress: number;
    currentStep: ProgressStep | null;
    isRunning: boolean;
    start: () => void;
    pause: () => void;
    reset: () => void;
    complete: () => void;
}

export function useProgressTimer(
    steps: ProgressStep[],
    options: UseProgressTimerOptions = {}
): UseProgressTimerReturn {
    const { autoStart = false, onComplete, onStepChange } = options;

    const [progress, setProgress] = useState(0);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isRunning, setIsRunning] = useState(autoStart);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);
    const pausedTimeRef = useRef<number>(0);

    const currentStep = steps[currentStepIndex] || null;
    const totalDuration = steps.reduce((sum, step) => sum + step.duration, 0);

    const clearTimer = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    const updateProgress = useCallback(() => {
        if (!currentStep || !isRunning) return;

        const now = Date.now();
        const elapsed = now - startTimeRef.current - pausedTimeRef.current;

        const stepProgress = Math.min(elapsed / currentStep.duration, 1);

        const completedSteps = steps.slice(0, currentStepIndex);
        const completedDuration = completedSteps.reduce((sum, step) => sum + step.duration, 0);
        const currentStepDuration = stepProgress * currentStep.duration;
        const totalProgress = ((completedDuration + currentStepDuration) / totalDuration) * 100;

        setProgress(Math.min(totalProgress, 100));


        onStepChange?.(currentStep, stepProgress * 100);

        if (stepProgress >= 1) {
            if (currentStepIndex < steps.length - 1) {
                //Próximo step
                setCurrentStepIndex(prev => prev + 1);
                startTimeRef.current = Date.now();
                pausedTimeRef.current = 0;
            } else {
                setProgress(100);
                setIsRunning(false);
                clearTimer();
                onComplete?.();
            }
        }
    }, [currentStep, currentStepIndex, isRunning, onComplete, onStepChange, steps, totalDuration, clearTimer]);

    const start = useCallback(() => {
        if (currentStepIndex >= steps.length) return;

        setIsRunning(true);
        if (startTimeRef.current === 0) {
            startTimeRef.current = Date.now();
        } else {
            pausedTimeRef.current += Date.now() - (startTimeRef.current + pausedTimeRef.current);
        }

        intervalRef.current = setInterval(updateProgress, 50); // 20 FPS
    }, [currentStepIndex, steps.length, updateProgress]);

    const pause = useCallback(() => {
        setIsRunning(false);
        clearTimer();
    }, [clearTimer]);

    const reset = useCallback(() => {
        setIsRunning(false);
        setProgress(0);
        setCurrentStepIndex(0);
        startTimeRef.current = 0;
        pausedTimeRef.current = 0;
        clearTimer();
    }, [clearTimer]);

    const complete = useCallback(() => {
        setProgress(100);
        setCurrentStepIndex(steps.length - 1);
        setIsRunning(false);
        clearTimer();
        onComplete?.();
    }, [clearTimer, onComplete, steps.length]);

    // Auto-start se solicitado
    useEffect(() => {
        if (autoStart && steps.length > 0) {
            start();
        }

        return () => clearTimer();
    }, [autoStart, steps.length, start, clearTimer]);

    // Cleanup on unmount
    useEffect(() => {
        return () => clearTimer();
    }, [clearTimer]);

    return {
        progress,
        currentStep,
        isRunning,
        start,
        pause,
        reset,
        complete
    };
}

export function useExportProgressSteps() {
    const defaultSteps: ProgressStep[] = [
        {
            name: 'preparation',
            duration: 500,
            message: 'Preparando dados da guia...'
        },
        {
            name: 'processing',
            duration: 800,
            message: 'Processando alimentos...'
        },
        {
            name: 'normalization',
            duration: 600,
            message: 'Normalizando unidades...'
        },
        {
            name: 'categorization',
            duration: 400,
            message: 'Categorizando itens...'
        },
        {
            name: 'template',
            duration: 700,
            message: 'Gerando documento...'
        },
        {
            name: 'export',
            duration: 1000,
            message: 'Criando arquivo final...'
        }
    ];

    return defaultSteps;
}