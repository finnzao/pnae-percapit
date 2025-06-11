import { UnidadeMedida } from "@/types/types";

export function obterCategoria(unidade: UnidadeMedida): 'peso' | 'volume' {
  if (['mg', 'g', 'kg', 'ton'].includes(unidade)) return 'peso';
  if (['ml', 'l', 'm³'].includes(unidade)) return 'volume';
  throw new Error(`Unidade desconhecida: ${unidade}`);
}

export function converterUnidade(
  valor: number,
  de: UnidadeMedida,
  para: UnidadeMedida
): number {
  const categoriaOrigem = obterCategoria(de);
  const categoriaDestino = obterCategoria(para);
  if (categoriaOrigem !== categoriaDestino) {
    throw new Error(`Conversão incompatível entre "${de}" e "${para}"`);
  }

  const fatores: Record<UnidadeMedida, number> = {
    // Peso: base em gramas
    mg: 0.001,
    g: 1,
    kg: 1000,
    ton: 1_000_000,

    // Volume: base em mililitros
    ml: 1,
    l: 1000,
    'm³': 1_000_000
  };

  const valorEmBase = valor * fatores[de];
  return valorEmBase / fatores[para];
}
