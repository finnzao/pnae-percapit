import { z } from 'zod';
import { RestricaoAlimentar } from './types';

export const etapaEnum = z.enum(['creche', 'pre', 'fundamental', 'medio']);
export type Etapa = z.infer<typeof etapaEnum>;

export const statusDisponibilidadeSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('disponivel'), valor: z.number() }),
  z.object({ status: z.literal('indisponivel') }),
  z.object({ status: z.literal('Depende da preparação da receita') }),
]);
export type ZodStatusDisponibilidade = z.infer<typeof statusDisponibilidadeSchema>;

export const alimentoSchema = z.object({
  id: z.string(),
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
  restricoesAlimentares: z.array(z.nativeEnum(RestricaoAlimentar)).optional(),
  _createdAt:z.string()
});
export type Alimento = z.infer<typeof alimentoSchema>;

// Schema para Endereço
export const enderecoSchema = z.object({
  logradouro: z.string().min(1, "Logradouro é obrigatório"),
  numero: z.string().min(1, "Número é obrigatório"),
  complemento: z.string().optional(),
  bairro: z.string().min(1, "Bairro é obrigatório"),
  cidade: z.string().min(1, "Cidade é obrigatória"),
  estado: z.string().length(2, "Estado deve ter 2 caracteres"),
  cep: z.string().regex(/^\d{5}-?\d{3}$/, "CEP inválido"),
});

// Schema para Aluno Atípico
export const alunoAtipicoSchema = z.object({
  restricaoId: z.nativeEnum(RestricaoAlimentar),
  restricaoNome: z.string(),
  quantidade: z.number().min(0, "Quantidade não pode ser negativa"),
});

// Schema para Instituição
export const instituicaoSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  tipo: z.enum(['Escola Municipal', 'Creche', 'Escola Estadual', 'Centro de Educação Infantil']),
  endereco: enderecoSchema,
  totalAlunos: z.number().min(1, "Total de alunos deve ser maior que zero"),
  alunosAtipicos: z.array(alunoAtipicoSchema),
});