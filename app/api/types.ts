import { z } from 'zod';

// Etapas
export const etapaEnum = z.enum(['creche', 'pre', 'fundamental', 'medio']);
export type Etapa = z.infer<typeof etapaEnum>;

// Status de disponibilidade
export const statusDisponibilidadeSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('disponivel'), valor: z.number() }),
  z.object({ status: z.literal('indisponivel') }),
  z.object({ status: z.literal('Depende da preparação da receita') }),
]);
export type StatusDisponibilidade = z.infer<typeof statusDisponibilidadeSchema>;

// Schema de alimento
export const alimentoSchema = z.object({
  nome: z.string(),
  fc: z.number(),
  fcc: z.number(),
  perCapita: z.object({
    creche: statusDisponibilidadeSchema,
    pre: statusDisponibilidadeSchema,
    fundamental: statusDisponibilidadeSchema,
    medio: statusDisponibilidadeSchema,
  }),
  limitada_menor3: z.boolean().optional(),
  limitada_todas: z.boolean().optional(),
});
export type Alimento = z.infer<typeof alimentoSchema>;

// Tipo de retorno do cálculo per capita
export interface ResultadoCalculo {
  alimento: string;
  etapa: Etapa;
  alunos: number;
  brutoPorAluno: number;
  totalBruto: number;
  totalFinal: number;
}
