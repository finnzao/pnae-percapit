// app/api/salvar-alimento/route.ts
import { NextResponse } from 'next/server';
import { alimentoSchema } from '@/app/api/types';
import { promises as fs } from 'fs';
import path from 'path';

// Caminho absoluto do arquivo alimentos.json
const ALIMENTOS_PATH = path.resolve(process.cwd(), 'app/api/alimentos.json');
// Função para normalizar nomes ignorando acentos e maiúsculas/minúsculas
function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD') // separa letras de acentos
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .toLowerCase()
    .trim();
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
    const parsed = alimentoSchema.parse(body);
    const nomeNormalizado = normalizarTexto(parsed.nome);

    // Lê o conteúdo atual do arquivo (ou inicializa com um array vazio se não existir)
    let alimentos: typeof parsed[] = [];

    try {
      const conteudoAtual = await fs.readFile(ALIMENTOS_PATH, 'utf-8');
      alimentos = JSON.parse(conteudoAtual);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      console.warn('[API] Nenhum arquivo existente ou erro ao ler, será criado um novo.');
    }

    // Verifica se o nome já existe (ignora acentos e maiúsculas)
    const existeDuplicado = alimentos.some(alimento =>
      normalizarTexto(alimento.nome) === nomeNormalizado
    );

    if (existeDuplicado) {
      return NextResponse.json(
        { ok: false, error: 'Já existe um alimento cadastrado com esse nome.' },
        { status: 400 }
      );
    }

    // Adiciona e salva
    alimentos.push(parsed);
    await fs.writeFile(ALIMENTOS_PATH, JSON.stringify(alimentos, null, 2), 'utf-8');

    console.log('[API] Alimento salvo com sucesso:', parsed);
    return NextResponse.json({ ok: true, recebido: parsed }, { status: 200 });

  } catch (error) {
    console.error('[API] Erro ao processar JSON:', error);
    console.log('[API] Body recebido (inválido):', body);
    return NextResponse.json({ ok: false, error: 'JSON INVÁLIDO' }, { status: 400 });
  }
}
