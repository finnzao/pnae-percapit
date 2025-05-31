import { Alimento, Etapa, ResultadoCalculo } from './types';

export function calcularPerCapita(
  alimento: string,
  etapa: Etapa,
  alunos: number,
  dados: Record<string, Alimento>
): ResultadoCalculo {
  const info = dados[alimento.toLowerCase()];
  if (!info || !info.perCapita[etapa]) {
    throw new Error('Dados do alimento ou da etapa não encontrados.');
  }

  const perCapitaRaw = info.perCapita[etapa].trim();

  // Casos não calculáveis
  if (['-', 'x', '*'].includes(perCapitaRaw)) {
    throw new Error(`O alimento não pode ser utilizado para a etapa "${etapa}" devido à restrição nutricional.`);
  }

  const perCapita = parseFloat(perCapitaRaw);
  const brutoPorAluno = perCapita * info.fc;
  const totalBruto = brutoPorAluno * alunos;
  const totalFinal = totalBruto * info.fcc;

  return {
    alimento: info.nome,
    etapa,
    alunos,
    brutoPorAluno,
    totalBruto,
    totalFinal
  };
}
