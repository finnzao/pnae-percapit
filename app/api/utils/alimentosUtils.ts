
import { Alimento } from '@/types/zodSchemas';
import alimentosJson from '../alimentos.json';
import { converterUnidade } from './conversaoUnidade';
import { StatusDisponibilidade, UnidadeMedida } from '@/types/types';


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
  try {
    const statusOriginal = input.status;
    const status = String(statusOriginal).trim().toLowerCase();

    if (status === 'disponivel') {
      const valor = typeof input.valor === 'number' ? input.valor : NaN;
      if (isNaN(valor)) {
        return { status: 'indisponivel' };
      }
      return { status: 'disponivel', valor };
    }

    if (status === 'indisponivel') {
      return { status: 'indisponivel' };
    }

    if (status === 'depende da preparação da receita') {
      return { status: 'Depende da preparação da receita' };
    }

    return { status: 'indisponivel' };
  } catch {
    return { status: 'indisponivel' };
  }
}




/**
 * Converte a lista de alimentos (array) em um mapa indexado pelo nome normalizado do alimento.
 */
export function converterListaParaMapaDeAlimentos(): Record<string, Alimento> {
  return Object.fromEntries(
    alimentosJson.map((a) => [
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
        unidade_medida: a.unidade_medida
      },
    ])
  );
}




interface ResultadoCalculo {
  totalBruto: number;
}
/**
 * Calcula quantas unidades comerciais (ex: pacotes) são necessárias
 * para suprir o total bruto de um alimento, considerando a unidade do pacote.
 */
export function calcularUnidadesNecessarias(
  resultado: ResultadoCalculo | null,
  pesoPacote: number | string,
  unidadePacote: UnidadeMedida,
  unidadeAlimento: UnidadeMedida
): number | null {
  if (!resultado || pesoPacote === '' || isNaN(Number(pesoPacote))) {
    return null;
  }

  const pesoNormalizado = parseFloat(String(pesoPacote).replace(',', '.'));
  if (isNaN(pesoNormalizado) || pesoNormalizado <= 0) {
    return null;
  }

  try {
    const pesoPacoteConvertido = converterUnidade(
      pesoNormalizado,
      unidadePacote,
      unidadeAlimento
    );

    if (pesoPacoteConvertido <= 0) return null;

    const quantidade = resultado.totalBruto / pesoPacoteConvertido;
    return Math.max(1, Math.ceil(quantidade));
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    return null;
  }
}
