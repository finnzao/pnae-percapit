import { GuiaAbastecimento, CalculoDistribuicao } from '@/types';

interface DiaCalendario {
  dia: number;
  mesAtual: boolean;
  guias: GuiaAbastecimento[];
}

/**
 * Calcula a distribuição dos últimos 7 dias com base em datas exatas
 */
export function calcularDistribuicaoSemanal(guias: GuiaAbastecimento[]): CalculoDistribuicao[] {
  const hoje = new Date();
  const seteDiasAtras = new Date(hoje);
  seteDiasAtras.setDate(hoje.getDate() - 7);
  
  // Ajusta para início e fim do dia
  seteDiasAtras.setHours(0, 0, 0, 0);
  hoje.setHours(23, 59, 59, 999);

  // Filtra guias distribuídas
  const guiasDistribuidas = guias.filter(guia => guia.status === 'Distribuído');

  // Agrupa todos os alimentos distribuídos no período exato
  const alimentosAgregados: Record<string, CalculoDistribuicao> = {};

  // Processa cada dia no período dos últimos 7 dias
  const dataAtual = new Date(seteDiasAtras);
  while (dataAtual <= hoje) {
    // Encontra guias ativas neste dia específico
    const guiasAtivasDia = guiasDistribuidas.filter(guia => {
      const inicioGuia = new Date(guia.dataInicio);
      const fimGuia = new Date(guia.dataFim);
      
      inicioGuia.setHours(0, 0, 0, 0);
      fimGuia.setHours(23, 59, 59, 999);
      
      return dataAtual >= inicioGuia && dataAtual <= fimGuia;
    });

    guiasAtivasDia.forEach(guia => {
      // Verifica se tem cardápio para este dia específico
      const cardapioDoDia = guia.cardapiosDiarios.find(cd => {
        const dataCardapio = new Date(cd.data);
        dataCardapio.setHours(0, 0, 0, 0);
        const dataCheck = new Date(dataAtual);
        dataCheck.setHours(0, 0, 0, 0);
        return dataCardapio.getTime() === dataCheck.getTime();
      });

      if (cardapioDoDia) {
        // Calcula quantidade proporcional para este dia
        const diasTotais = guia.cardapiosDiarios.length;
        
        guia.calculosDistribuicao.forEach(calculo => {
          const quantidadeDiaria = calculo.quantidadeTotal / diasTotais;
          
          if (!alimentosAgregados[calculo.alimentoId]) {
            alimentosAgregados[calculo.alimentoId] = {
              ...calculo,
              quantidadeTotal: 0,
              detalhamentoRefeicoes: []
            };
          }
          
          alimentosAgregados[calculo.alimentoId].quantidadeTotal += quantidadeDiaria;
        });
      }
    });

    dataAtual.setDate(dataAtual.getDate() + 1);
  }

  return Object.values(alimentosAgregados);
}

/**
 * Gera o calendário para o mês especificado
 */
export function gerarCalendarioMes(mesAtual: Date, guias: GuiaAbastecimento[]): DiaCalendario[] {
  const ano = mesAtual.getFullYear();
  const mes = mesAtual.getMonth();
  const primeiroDia = new Date(ano, mes, 1);
  const ultimoDia = new Date(ano, mes + 1, 0);
  const primeiroDiaSemana = primeiroDia.getDay();
  
  const dias: DiaCalendario[] = [];
  
  // Dias do mês anterior
  for (let i = primeiroDiaSemana - 1; i >= 0; i--) {
    const data = new Date(ano, mes, -i);
    dias.push({
      dia: data.getDate(),
      mesAtual: false,
      guias: []
    });
  }
  
  // Dias do mês atual
  for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
    const dataAtual = new Date(ano, mes, dia);
    const guiasDoDia = guias.filter(guia => {
      const inicio = new Date(guia.dataInicio);
      const fim = new Date(guia.dataFim);
      return dataAtual >= inicio && dataAtual <= fim;
    });
    
    dias.push({
      dia,
      mesAtual: true,
      guias: guiasDoDia
    });
  }
  
  // Completar com dias do próximo mês
  const diasRestantes = 42 - dias.length;
  for (let dia = 1; dia <= diasRestantes; dia++) {
    dias.push({
      dia,
      mesAtual: false,
      guias: []
    });
  }
  
  return dias;
}

/**
 * Filtra guias que estão ativas no mês especificado
 */
export function filtrarGuiasDoMes(guias: GuiaAbastecimento[], mesAtual: Date): GuiaAbastecimento[] {
  const primeiroDiaMes = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), 1);
  const ultimoDiaMes = new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 0);
  
  return guias.filter(guia => {
    const inicio = new Date(guia.dataInicio);
    const fim = new Date(guia.dataFim);
    return (inicio <= ultimoDiaMes && fim >= primeiroDiaMes);
  });
}

/**
 * Obtém ícones de status das guias
 */
export function getStatusIcon(status: string) {
  const icons = {
    'Rascunho': 'Clock',
    'Finalizado': 'CheckCircle',
    'Distribuído': 'Package'
  };
  return icons[status as keyof typeof icons] || null;
}

/**
 * Obtém cores de status das guias
 */
export function getStatusColor(status: string): string {
  const colors = {
    'Rascunho': 'bg-yellow-400',
    'Finalizado': 'bg-blue-400',
    'Distribuído': 'bg-green-400'
  };
  return colors[status as keyof typeof colors] || 'bg-gray-400';
}

/**
 * Formata data para exibição no formato brasileiro
 */
export function formatarMesBr(data: Date): string {
  return data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}