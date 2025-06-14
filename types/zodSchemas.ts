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
  id: z.string().uuid(),
  nome: z.string(),
  fc: z.number(), // fator de correção
  fcc: z.number(), // fator de cocção
  perCapita: z.object({
    creche: statusDisponibilidadeSchema,
    pre: statusDisponibilidadeSchema,
    fundamental: statusDisponibilidadeSchema,
    medio: statusDisponibilidadeSchema,
  }),
  limitada_menor3: z.boolean().optional(),
  limitada_todas: z.boolean().optional(),
  unidade_medida: z.string().default('g'), 
  peso_pacote_padrao: z.number().optional(),
  ativo: z.boolean().default(true),
  criado_em: z.date(),
  atualizado_em: z.date(),
});

export const escolaSchema = z.object({
  id: z.string(),
  nome: z.string(),
  codigo: z.string().optional(),
  ativa: z.boolean().default(true),
  criado_em: z.string(),
  alunos: z.number()
});

export const cardapioSalvoSchema = z.object({
  id: z.string(),
  escola_id: z.string(),
  data: z.string(),
  nome: z.string().optional(),
  refeicoes: z.array(z.object({
    id: z.string(),
    nome: z.string(),
    horario: z.string().optional(),
    alimentos: z.array(z.object({
      alimento_nome: z.string(),
      peso_pacote: z.number().optional(),
    })),
  })),
  ativo: z.boolean().default(true),
  criado_em: z.string(),
});

export type Escola = z.infer<typeof escolaSchema>;
export type CardapioSalvo = z.infer<typeof cardapioSalvoSchema>;
export type Alimento = z.infer<typeof alimentoSchema>;
