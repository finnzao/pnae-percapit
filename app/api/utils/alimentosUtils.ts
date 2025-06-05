import type { Alimento, StatusDisponibilidade } from '../types';
import alimentosJson from '../alimentos.json';


// Tipagem para os arquivos que iram vim do json
type RawStatusDisponibilidade = {
  status: string;
  valor?: unknown;
};


/**
 * Remove acentos e transforma em minúsculas para facilitar comparações de texto.
 */
export function normalizarTexto(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}



/**
 * Transformar unidade de peso Grama em Kg.
 */
export function formatarPesoKg(gramas: number) {
  const kg = gramas / 1000;
  return `${gramas.toFixed(2)}g / ${kg.toFixed(2)}kg`;
};


function converterStatusDisponibilidade(input: RawStatusDisponibilidade): StatusDisponibilidade {
  if (input.status === 'disponivel' && typeof input.valor === 'number') {
    return { status: 'disponivel', valor: input.valor };
  }
  if (input.status === 'indisponivel') {
    return { status: 'indisponivel' };
  }
  if (input.status === 'Depende da preparação da receita') {
    return { status: 'Depende da preparação da receita' };
  }

  throw new Error(`Status inválido no alimento JSON: ${JSON.stringify(input)}`);
}

/**
 * Converte a lista de alimentos (array) em um mapa indexado pelo nome normalizado do alimento.
 */
export function converterListaParaMapaDeAlimentos(): Record<string, Alimento> {
  return Object.fromEntries(
    alimentosJson.alimentos.map((a) => [
      normalizarTexto(a.nome),
      {
        nome: a.nome,
        fc: Number(a.fc),
        fcc: Number(a.fcc),
        perCapita: {
          creche: converterStatusDisponibilidade(a.perCapita.creche),
          pre: converterStatusDisponibilidade(a.perCapita.pre),
          fundamental: converterStatusDisponibilidade(a.perCapita.fundamental),
          medio: converterStatusDisponibilidade(a.perCapita.medio),
        },
        limitada_menor3: a.limitada_menor3,
        limitada_todas: a.limitada_todas,
      },
    ])
  );
}



