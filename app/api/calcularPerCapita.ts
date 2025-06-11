import { ResultadoCalculo, Alimento, Etapa } from "@/types";


export function calcularPerCapita(
  alimento: string,
  etapa: Etapa,
  alunos: number,
  dados: Record<string, Alimento>
): ResultadoCalculo {
  const info = dados[alimento.toLowerCase()];
  if (!info) {
    throw new Error('Alimento não encontrado.');
  }

  const etapaInfo = info.perCapita[etapa];

  if (etapaInfo.status !== 'disponivel') {
    throw new Error(`O alimento não pode ser utilizado para a etapa "${etapa}" porque está indisponível.`);
  }

  const fc = info.fc
  const fcc = info.fcc

  if (isNaN(fc) || isNaN(fcc)) {
    throw new Error(`Fator de correção ou fator de cocção inválido para o alimento "${info.nome}".`);
  }

  const perCapita = etapaInfo.valor;
  const brutoPorAluno = perCapita * fc;
  const totalBruto = brutoPorAluno * alunos;
  const totalFinal = totalBruto * fcc;

  return {
    alimento: info.nome,
    etapa,
    alunos,
    brutoPorAluno,
    totalBruto,
    totalFinal,
  };
}
