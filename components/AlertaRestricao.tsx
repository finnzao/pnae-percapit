import { AlertCircle, AlertTriangle } from 'lucide-react';

interface AlertaRestricaoProps {
  restricoes: Restricao[];
}

export interface Restricao {
  tipo: 'erro' | 'aviso';
  mensagem: string;
}

const estilos = {
  erro: {
    container: 'bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3',
    icone: <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
  },
  aviso: {
    container: 'bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-lg flex items-start gap-3',
    icone: <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
  }
};

export default function AlertaRestricao({ restricoes }: AlertaRestricaoProps) {
  if (restricoes.length === 0) return null;

  return (
    <div className="space-y-3">
      {restricoes.map((r, idx) => (
        <div key={idx} className={estilos[r.tipo].container}>
          {estilos[r.tipo].icone}
          <span className="text-sm">{r.mensagem}</span>
        </div>
      ))}
    </div>
  );
}