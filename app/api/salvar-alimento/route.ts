import { NextResponse } from 'next/server';
import { instituicaoSchema } from '@/types/zodSchemas';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const INSTITUICOES_PATH = path.resolve(process.cwd(), 'app/api/instituicoes.json');

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
    const parsed = instituicaoSchema.parse(body);
    
    // Adiciona campos adicionais
    const instituicao = {
      id: uuidv4(),
      ...parsed,
      dataCadastro: new Date(),
      dataAtualizacao: new Date(),
      ativo: true
    };

    // Lê o conteúdo atual do arquivo
    let instituicoes: any[] = [];
    try {
      const conteudoAtual = await fs.readFile(INSTITUICOES_PATH, 'utf-8');
      instituicoes = JSON.parse(conteudoAtual);
    } catch (err) {
      console.warn('[API] Nenhum arquivo de instituições existente, será criado um novo.');
    }

    // Verifica duplicados
    const nomeNormalizado = normalizarTexto(instituicao.nome);
    const existeDuplicado = instituicoes.some(inst =>
      normalizarTexto(inst.nome) === nomeNormalizado && inst.ativo
    );

    if (existeDuplicado) {
      return NextResponse.json(
        { ok: false, error: 'Já existe uma instituição cadastrada com esse nome.' },
        { status: 400 }
      );
    }

    // Adiciona e salva
    instituicoes.push(instituicao);
    await fs.writeFile(INSTITUICOES_PATH, JSON.stringify(instituicoes, null, 2), 'utf-8');

    console.log('[API] Instituição salva com sucesso:', instituicao);
    return NextResponse.json({ ok: true, data: instituicao }, { status: 200 });

  } catch (error) {
    console.error('[API] Erro ao processar instituição:', error);
    return NextResponse.json({ 
      ok: false, 
      error: error instanceof Error ? error.message : 'Erro ao salvar instituição' 
    }, { status: 400 });
  }
}

export async function GET() {
  try {
    const conteudo = await fs.readFile(INSTITUICOES_PATH, 'utf-8');
    const instituicoes = JSON.parse(conteudo);
    
    // Retorna apenas instituições ativas
    const instituicoesAtivas = instituicoes.filter((inst: any) => inst.ativo);
    
    return NextResponse.json({ ok: true, data: instituicoesAtivas }, { status: 200 });
  } catch (error) {
    console.warn('[API] Erro ao ler instituições:', error);
    return NextResponse.json({ ok: true, data: [] }, { status: 200 });
  }
}