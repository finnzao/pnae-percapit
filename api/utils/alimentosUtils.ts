import type { Alimento } from '../types';
import alimentosJson from '../alimentos.json';

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
/**
 * Converte a lista de alimentos (array) em um mapa indexado pelo nome normalizado do alimento.
 */
export function converterListaParaMapaDeAlimentos(): Record<string, Alimento> {
  return Object.fromEntries(
    alimentosJson.alimentos.map((a) => [
      normalizarTexto(a.alimento),
      {
        nome: a.alimento,
        fc: Number(a.fator_correcao),
        fcc: Number(a.fator_coccao),
        perCapita: {
          creche: a.creche,
          pre: a.pre_escola,
          fundamental: a.fundamental,
          medio: a.medio_eja,
        },
      },
    ])
  );


}
