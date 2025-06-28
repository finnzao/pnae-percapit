import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
    isLoading: boolean;
    message?: string;
    size?: 'sm' | 'md' | 'lg';
    overlay?: boolean;
    className?: string;
}

export default function LoadingOverlay({
    isLoading,
    message = 'Carregando...',
    size = 'md',
    overlay = false,
    className = ''
}: LoadingOverlayProps) {
    if (!isLoading) return null;

    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-8 h-8'
    };

    const textSizeClasses = {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg'
    };

    if (overlay) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-xl shadow-xl flex flex-col items-center gap-4">
                    <Loader2 className={`${sizeClasses[size]} animate-spin text-[#4C6E5D]`} />
                    <p className={`${textSizeClasses[size]} text-gray-700 font-medium`}>{message}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex items-center justify-center gap-3 ${className}`}>
            <Loader2 className={`${sizeClasses[size]} animate-spin text-[#4C6E5D]`} />
            <span className={`${textSizeClasses[size]} text-gray-600`}>{message}</span>
        </div>
    );
}

// Componente para loading em linha (inline)
export function InlineLoading({
    isLoading,
    message = 'Carregando...',
    size = 'sm'
}: Omit<LoadingOverlayProps, 'overlay' | 'className'>) {
    return (
        <LoadingOverlay
            isLoading={isLoading}
            message={message}
            size={size}
            overlay={false}
            className="py-2"
        />
    );
}

// Componente para loading em seções específicas
export function SectionLoading({
    isLoading,
    message = 'Atualizando dados...',
    size = 'md',
    className = ''
}: Omit<LoadingOverlayProps, 'overlay'>) {
    return (
        <LoadingOverlay
            isLoading={isLoading}
            message={message}
            size={size}
            overlay={false}
            className={`py-8 ${className}`}
        />
    );
}