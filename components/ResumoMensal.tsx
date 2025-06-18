import { useRouter } from 'next/navigation';
import { Clock, CheckCircle, Package } from 'lucide-react';
import { GuiaAbastecimento } from '@/types';

interface ResumoMensalProps {
  guias: GuiaAbastecimento[];
  carregando: boolean;
}

export default function ResumoMensal({ guias, carregando }: ResumoMensalProps) {
  const router = useRouter();

  const getStatusIcon = (status: string) => {
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

  const contarPorStatus = () => {
    const contagem = {
      rascunho: 0,
      finalizado: 0,
      distribuido: 0
    };

    guias.forEach(guia => {
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
    });

    return contagem;
  };

  const contagem = contarPorStatus();

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-[#4C6E5D] mb-4">
        Resumo do Mês
      </h3>
      
      {carregando ? (
        <p className="text-gray-500">Carregando...</p>
      ) : guias.length === 0 ? (
        <p className="text-gray-500">Nenhuma guia neste mês</p>
      ) : (
        <div className="space-y-4">
          {/* Total de Guias */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-3xl font-bold text-[#4C6E5D]">{guias.length}</p>
            <p className="text-sm text-gray-600">Guias no mês</p>
          </div>
          
          {/* Contagem por Status */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-yellow-50 p-3 rounded-lg text-center">
              <p className="text-xl font-bold text-yellow-800">{contagem.rascunho}</p>
              <p className="text-xs text-yellow-600">Rascunho</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg text-center">
              <p className="text-xl font-bold text-blue-800">{contagem.finalizado}</p>
              <p className="text-xs text-blue-600">Finalizado</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg text-center">
              <p className="text-xl font-bold text-green-800">{contagem.distribuido}</p>
              <p className="text-xs text-green-600">Distribuído</p>
            </div>
          </div>
          
          {/* Guias Recentes */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700 mb-2">Guias Recentes</p>
            {guias.slice(0, 3).map(guia => (
              <div
                key={guia.id}
                onClick={() => router.push(`/guia-abastecimento/${guia.id}`)}
                className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{guia.instituicaoNome}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(guia.dataInicio).toLocaleDateString('pt-BR')} - 
                      {new Date(guia.dataFim).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 ${
                    guia.status === 'Rascunho' ? 'bg-yellow-100 text-yellow-800' :
                    guia.status === 'Finalizado' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {getStatusIcon(guia.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          {guias.length > 3 && (
            <button
              onClick={() => router.push('/guia-abastecimento')}
              className="w-full text-center text-sm text-[#4C6E5D] hover:text-[#6B7F66] transition"
            >
              Ver todas ({guias.length})
            </button>
          )}
        </div>
      )}
    </div>
  );
}