// app/api/salvar-alimento/route.ts
import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { readJsonFile, writeJsonFile, generateId } from '../utils/jsonStorage';
import { alimentoSchema, type Alimento } from '@/types/zodSchemas';
const FILENAME = 'alimentos.json';

const alimentos = await readJsonFile<Alimento>(FILENAME);
function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
    const parsed = alimentoSchema.parse(body);
    const nomeNormalizado = normalizarTexto(parsed.nome);

    let alimentos: typeof parsed[] = [];
    const novoAlimento: Alimento = {
      id: generateId(),
      nome: parsed.nome.trim(),
      fc: Number(parsed.fc.replace(',', '.')),
      fcc: Number(parsed.fcc.replace(',', '.')),
      perCapita: parsed.perCapita,
      limitada_menor3: parsed.limitada_menor3,
      limitada_todas: parsed.limitada_todas,
      unidade_medida: parsed.unidade_medida || 'g',
      peso_pacote_padrao: undefined,
      ativo: true,
      criado_em: new Date().toISOString(),
    };
    try {
      const conteudoAtual = await fs.readFile(ALIMENTOS_PATH, 'utf-8');
      alimentos = JSON.parse(conteudoAtual);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      console.warn('[API] Nenhum arquivo existente ou erro ao ler, será criado um novo.');
    }

    // Verifica se o nome já existe (ignora acentos e maiúsculas)
    const existeDuplicado = alimentos.some(alimento =>
      normalizarTexto(alimento.nome) === nomeNormalizado && alimento.ativo
    );

    if (existeDuplicado) {
      return NextResponse.json(
        { ok: false, error: 'Já existe um alimento cadastrado com esse nome.' },
        { status: 400 }
      );
    }

    // Adiciona e salva
    alimentos.push(novoAlimento);
    await writeJsonFile(FILENAME, alimentos);

    console.log('[API] Alimento salvo com sucesso:', parsed);
    return NextResponse.json({ ok: true, recebido: parsed }, { status: 200 });

  } catch (error) {
    console.error('[API] Erro ao processar JSON:', error);
    console.log('[API] Body recebido (inválido):', body);
    return NextResponse.json({ ok: false, error: 'JSON INVÁLIDO' }, { status: 400 });
  }
}
