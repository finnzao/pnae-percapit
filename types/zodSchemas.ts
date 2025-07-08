import { z } from 'zod';

export const etapaEnum = z.enum(['creche', 'pre', 'fundamental', 'medio']);
export type Etapa = z.infer<typeof etapaEnum>;

export const statusDisponibilidadeSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('disponivel'), valor: z.number() }),
  z.object({ status: z.literal('indisponivel') }),
  z.object({ status: z.literal('Depende da preparação da receita') }),
]);
export type ZodStatusDisponibilidade = z.infer<typeof statusDisponibilidadeSchema>;

export enum RestricaoAlimentar {
    ALERGICO_GLUTEN = "ALERGICO_GLUTEN",
    ALERGICO_LACTOSE = "ALERGICO_LACTOSE",
    ALERGICO_FRUTOS_MAR = "ALERGICO_FRUTOS_MAR",
    ALERGICO_AMENDOIM = "ALERGICO_AMENDOIM",
    ALERGICO_SOJA = "ALERGICO_SOJA",
    ALERGICO_OVOS = "ALERGICO_OVOS",
    INTOLERANTE_LACTOSE = "INTOLERANTE_LACTOSE",
    INTOLERANTE_FRUTOSE = "INTOLERANTE_FRUTOSE",
    CELIACO = "CELIACO",
    DIABETES = "DIABETES",
    FENILCETONURIA = "FENILCETONURIA",
    RESTRICAO_CUSTOM = "RESTRICAO_CUSTOM"
}

export enum CategoriaAlimento {
    ABASTECIMENTO = 'Abastecimento',
    HORTIFRUTI = 'Hortifrútis',
    PROTEINAS = 'Proteínas',
    GRAOS_CEREAIS = 'Grãos e Cereais',
    LATICINIOS = 'Laticínios',
    BEBIDAS = 'Bebidas',
    CONDIMENTOS = 'Condimentos e Temperos',
    DOCES_SOBREMESAS = 'Doces e Sobremesas',
    PANIFICACAO = 'Panificação',
    CONSERVAS = 'Conservas e Enlatados',
    CONGELADOS = 'Congelados',
    OUTROS = 'Outros'
}

export const categoriaAlimentoSchema = z.nativeEnum(CategoriaAlimento);

export const alimentoSchema = z.object({
  id: z.string(),
  nome: z.string(),
  fc: z.number(),
  fcc: z.number(),
  categoria: categoriaAlimentoSchema,
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
  _createdAt: z.string()
});
export type Alimento = z.infer<typeof alimentoSchema>;

export const criarAlimentoSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  fc: z.number().min(0.1, "Fator de Correção deve ser maior que 0"),
  fcc: z.number().min(0.1, "Fator de Cozimento deve ser maior que 0"),
  categoria: categoriaAlimentoSchema,
  perCapita: z.object({
    creche: statusDisponibilidadeSchema,
    pre: statusDisponibilidadeSchema,
    fundamental: statusDisponibilidadeSchema,
    medio: statusDisponibilidadeSchema,
  }),
  limitada_menor3: z.boolean().optional().default(false),
  limitada_todas: z.boolean().optional().default(false),
  unidade_medida: z.string().optional().default('g'),
  restricoesAlimentares: z.array(z.nativeEnum(RestricaoAlimentar)).optional().default([]),
});
export type CriarAlimentoRequest = z.infer<typeof criarAlimentoSchema>;

export const atualizarAlimentoSchema = z.object({
  id: z.string(),
  nome: z.string().min(1, "Nome é obrigatório").optional(),
  fc: z.number().min(0.1, "Fator de Correção deve ser maior que 0").optional(),
  fcc: z.number().min(0.1, "Fator de Cozimento deve ser maior que 0").optional(),
  categoria: categoriaAlimentoSchema.optional(),
  perCapita: z.object({
    creche: statusDisponibilidadeSchema,
    pre: statusDisponibilidadeSchema,
    fundamental: statusDisponibilidadeSchema,
    medio: statusDisponibilidadeSchema,
  }).optional(),
  limitada_menor3: z.boolean().optional(),
  limitada_todas: z.boolean().optional(),
  unidade_medida: z.string().optional(),
  restricoesAlimentares: z.array(z.nativeEnum(RestricaoAlimentar)).optional(),
});
export type AtualizarAlimentoRequest = z.infer<typeof atualizarAlimentoSchema>;

export const enderecoSchema = z.object({
  logradouro: z.string().min(1, "Logradouro é obrigatório"),
  numero: z.string().min(1, "Número é obrigatório"),
  complemento: z.string().optional(),
  bairro: z.string().min(1, "Bairro é obrigatório"),
  cidade: z.string().min(1, "Cidade é obrigatória"),
  estado: z.string().length(2, "Estado deve ter 2 caracteres"),
  cep: z.string().regex(/^\d{5}-?\d{3}$/, "CEP inválido"),
});

export const alunoAtipicoSchema = z.object({
  restricaoId: z.nativeEnum(RestricaoAlimentar),
  restricaoNome: z.string(),
  quantidade: z.number().min(0, "Quantidade não pode ser negativa"),
});

export const instituicaoSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  tipo: z.enum(['Escola Municipal', 'Creche', 'Escola Estadual', 'Centro de Educação Infantil']),
  endereco: enderecoSchema,
  totalAlunos: z.number().min(1, "Total de alunos deve ser maior que zero"),
  alunosAtipicos: z.array(alunoAtipicoSchema),
});