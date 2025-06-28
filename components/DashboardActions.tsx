import { useRouter } from 'next/navigation';
import {
    Utensils,
    Calculator,
    Building2,
    FileText,
    BarChart,
    Package
} from 'lucide-react';

interface ActionItem {
    title: string;
    description?: string;
    icon: React.ReactElement;
    onClick: () => void;
    color: string;
    primary?: boolean;
}

export default function DashboardActions() {
    const router = useRouter();

    const mainActions: ActionItem[] = [
        {
            title: 'Alimentos',
            description: 'Gerencie os alimentos do sistema',
            icon: <Package className="h-6 w-6" />,
            onClick: () => router.push('/alimentos'),
            color: '#4C6E5D',
            primary: true
        },
        {
            title: 'Criar Cardápio',
            description: 'Monte cardápios completos',
            icon: <Utensils className="h-6 w-6" />,
            onClick: () => router.push('/cardapio'),
            color: '#6B7F66',
            primary: true
        },
        {
            title: 'Nova Guia',
            description: 'Gere guias de abastecimento',
            icon: <FileText className="h-6 w-6" />,
            onClick: () => router.push('/guia-abastecimento/criar'),
            color: '#4C6E5D',
            primary: true
        }
    ];

    const secondaryActions: ActionItem[] = [
        {
            title: 'Calculadora',
            icon: <Calculator className="h-5 w-5" />,
            onClick: () => router.push('/calcular'),
            color: '#4C6E5D'
        },
        {
            title: 'Instituições',
            icon: <Building2 className="h-5 w-5" />,
            onClick: () => router.push('/instituicoes'),
            color: '#4C6E5D'
        },
        {
            title: 'Ver Cardápios',
            icon: <FileText className="h-5 w-5" />,
            onClick: () => router.push('/cardapios'),
            color: '#4C6E5D'
        },
        {
            title: 'Ver Guias',
            icon: <Package className="h-5 w-5" />,
            onClick: () => router.push('/guia-abastecimento'),
            color: '#4C6E5D'
        },
        {
            title: 'Relatórios',
            icon: <BarChart className="h-5 w-5" />,
            onClick: () => router.push('/relatorios'),
            color: '#4C6E5D'
        }
    ];

    return (
        <>
            {/* Ações Principais */}
            <ActionsSection
                title="Ações Principais"
                actions={mainActions}
                gridCols="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                primary
            />

            {/* Ações Secundárias */}
            <ActionsSection
                title="Mais Opções"
                actions={secondaryActions}
                gridCols="grid-cols-2 sm:grid-cols-3 md:grid-cols-5"
                primary={false}
            />
        </>
    );
}

interface ActionsSectionProps {
    title: string;
    actions: ActionItem[];
    gridCols: string;
    primary: boolean;
}

function ActionsSection({ title, actions, gridCols, primary }: ActionsSectionProps) {
    return (
        <div className="mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-[#4C6E5D] mb-3 sm:mb-4">
                {title}
            </h2>
            <div className={`grid ${gridCols} gap-3 sm:gap-4`}>
                {actions.map((action, index) =>
                    primary ? (
                        <PrimaryActionCard key={index} action={action} />
                    ) : (
                        <SecondaryActionCard key={index} action={action} />
                    )
                )}
            </div>
        </div>
    );
}

interface ActionCardProps {
    action: ActionItem;
}

function PrimaryActionCard({ action }: ActionCardProps) {
    return (
        <button
            onClick={action.onClick}
            className="flex flex-col items-center justify-center bg-white rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-all transform hover:-translate-y-1 text-center h-40 sm:h-48 border-2 border-transparent hover:border-[#C8D5B9]"
        >
            <div
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mb-3 sm:mb-4"
                style={{ backgroundColor: `${action.color}20` }}
            >
                <div style={{ color: action.color }}>
                    {action.icon}
                </div>
            </div>
            <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">
                {action.title}
            </h3>
            {action.description && (
                <p className="text-xs sm:text-sm text-gray-600">
                    {action.description}
                </p>
            )}
        </button>
    );
}

function SecondaryActionCard({ action }: ActionCardProps) {
    return (
        <button
            onClick={action.onClick}
            className="flex items-center gap-2 sm:gap-3 bg-white rounded-lg p-3 sm:p-4 shadow-sm hover:shadow-md transition-all justify-center md:justify-start"
        >
            <div className="text-[#4C6E5D]">
                {action.icon}
            </div>
            <span className="font-medium text-xs sm:text-sm md:inline">
                {action.title}
            </span>
        </button>
    );
}