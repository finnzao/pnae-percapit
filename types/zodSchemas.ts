import { z } from 'zod';

export const etapaEnum = z.enum(['creche', 'pre', 'fundamental', 'medio']);
export type Etapa = z.infer<typeof etapaEnum>;

export const statusDisponibilidadeSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('disponivel'), valor: z.number() }),
  z.object({ status: z.literal('indisponivel') }),
  z.object({ status: z.literal('Depende da preparação da receita') }),
]);
export type ZodStatusDisponibilidade = z.infer<typeof statusDisponibilidadeSchema>;

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
  unidade_medida: z.string().optional(),
});
export type Alimento = z.infer<typeof alimentoSchema>;
