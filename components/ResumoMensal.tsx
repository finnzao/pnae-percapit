import { useRouter } from 'next/navigation';
import { Clock, CheckCircle, Package } from 'lucide-react';
import { GuiaAbastecimento } from '@/types';

interface ResumoMensalProps {
  guias: GuiaAbastecimento[];
  carregando: boolean;
}

interface StatusCount {
  rascunho: number;
  finalizado: number;
  distribuido: number;
}

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'Rascunho':
      return <Clock className="w-3 h-3" />;
    case 'Finalizado':
      return <CheckCircle className="w-3 h-3" />;
    case 'Distribuído':
      return <Package className="w-3 h-3" />;
    default:
      return null;
  }
};

export default function ResumoMensal({ guias, carregando }: ResumoMensalProps) {
  const router = useRouter();

  const contarPorStatus = (): StatusCount => {
    return guias.reduce((contagem, guia) => {
      switch (guia.status) {
        case 'Rascunho':
          contagem.rascunho++;
          break;
        case 'Finalizado':
          contagem.finalizado++;
          break;
        case 'Distribuído':
          contagem.distribuido++;
          break;
      }
      return contagem;
    }, { rascunho: 0, finalizado: 0, distribuido: 0 });
  };

  const navegarParaGuia = (guiaId: string) => {
    router.push(`/guia-abastecimento/${guiaId}`);
  };

  const navegarParaTodasGuias = () => {
    router.push('/guia-abastecimento');
  };

  if (carregando) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-[#4C6E5D] mb-4">
          Resumo do Mês
        </h3>
        <p className="text-gray-500">Carregando...</p>
      </div>
    );
  }

  if (guias.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-[#4C6E5D] mb-4">
          Resumo do Mês
        </h3>
        <p className="text-gray-500">Nenhuma guia neste mês</p>
      </div>
    );
  }

  const contagem = contarPorStatus();

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-[#4C6E5D] mb-4">
        Resumo do Mês
      </h3>
      
      <div className="space-y-4">
        {/* Total de Guias */}
        <TotalGuiasCard total={guias.length} />
        
        {/* Contagem por Status */}
        <StatusGrid contagem={contagem} />
        
        {/* Guias Recentes */}
        <GuiasRecentes 
          guias={guias.slice(0, 3)} 
          totalGuias={guias.length}
          onGuiaClick={navegarParaGuia}
          onVerTodas={navegarParaTodasGuias}
        />
      </div>
    </div>
  );
}

function TotalGuiasCard({ total }: { total: number }) {
  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <p className="text-3xl font-bold text-[#4C6E5D]">{total}</p>
      <p className="text-sm text-gray-600">Guias no mês</p>
    </div>
  );
}

function StatusGrid({ contagem }: { contagem: StatusCount }) {
  const statusItems = [
    { key: 'rascunho', count: contagem.rascunho, label: 'Rascunho', bgColor: 'bg-yellow-50', textColor: 'text-yellow-800' },
    { key: 'finalizado', count: contagem.finalizado, label: 'Finalizado', bgColor: 'bg-blue-50', textColor: 'text-blue-800' },
    { key: 'distribuido', count: contagem.distribuido, label: 'Distribuído', bgColor: 'bg-green-50', textColor: 'text-green-800' }
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {statusItems.map((item) => (
        <div key={item.key} className={`${item.bgColor} p-3 rounded-lg text-center`}>
          <p className={`text-xl font-bold ${item.textColor}`}>{item.count}</p>
          <p className={`text-xs ${item.textColor.replace('800', '600')}`}>{item.label}</p>
        </div>
      ))}
    </div>
  );
}

interface GuiasRecentesProps {
  guias: GuiaAbastecimento[];
  totalGuias: number;
  onGuiaClick: (guiaId: string) => void;
  onVerTodas: () => void;
}

function GuiasRecentes({ guias, totalGuias, onGuiaClick, onVerTodas }: GuiasRecentesProps) {
  const formatarDataPeriodo = (inicio: string | Date, fim: string | Date) => {
    const dataInicio = new Date(inicio).toLocaleDateString('pt-BR');
    const dataFim = new Date(fim).toLocaleDateString('pt-BR');
    return `${dataInicio} - ${dataFim}`;
  };

  const getStatusClasses = (status: string) => {
    const classes = {
      'Rascunho': 'bg-yellow-100 text-yellow-800',
      'Finalizado': 'bg-blue-100 text-blue-800',
      'Distribuído': 'bg-green-100 text-green-800'
    };
    return classes[status as keyof typeof classes] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700 mb-2">Guias Recentes</p>
      
      {guias.map(guia => (
        <div
          key={guia.id}
          onClick={() => onGuiaClick(guia.id)}
          className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="font-medium text-sm">{guia.instituicaoNome}</p>
              <p className="text-xs text-gray-500">
                {formatarDataPeriodo(guia.dataInicio, guia.dataFim)}
              </p>
            </div>
            <span className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 ${getStatusClasses(guia.status)}`}>
              <StatusIcon status={guia.status} />
            </span>
          </div>
        </div>
      ))}
      
      {totalGuias > 3 && (
        <button
          onClick={onVerTodas}
          className="w-full text-center text-sm text-[#4C6E5D] hover:text-[#6B7F66] transition"
        >
          Ver todas ({totalGuias})
        </button>
      )}
    </div>
  );
}