interface AlertaRestricaoProps {
    restricoes: Restricao[];
  }
  
  export interface Restricao {
    tipo: 'erro' | 'aviso';
    mensagem: string;
  }
  
  const estilos = {
    erro: {
      container: 'text-red-800 bg-red-100 border border-red-400 p-3 rounded',
      prefixo: '❌'
    },
    aviso: {
      container: 'text-yellow-800 bg-yellow-100 border border-yellow-400 p-3 rounded',
      prefixo: '⚠️'
    }
  };
  
  export default function AlertaRestricao({ restricoes }: AlertaRestricaoProps) {
    if (restricoes.length === 0) return null;
  
    return (
      <div className="space-y-3">
        {restricoes.map((r, idx) => (
          <div key={idx} className={estilos[r.tipo].container}>
            {estilos[r.tipo].prefixo} {r.mensagem}
          </div>
        ))}
      </div>
    );
  }
  