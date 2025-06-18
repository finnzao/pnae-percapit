import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Instituicao } from '@/types';

const INSTITUICOES_PATH = path.resolve(process.cwd(), 'app/api/instituicoes.json');

// Cache para evitar duplicações
const recentRequests = new Map<string, number>();
const DUPLICATE_WINDOW = 2000; // 2 segundos

function cleanOldRequests() {
  const now = Date.now();
  for (const [key, timestamp] of recentRequests.entries()) {
    if (now - timestamp > DUPLICATE_WINDOW) {
      recentRequests.delete(key);
    }
  }
}

type InstituicaoInput = Omit<Instituicao, 'id' | 'dataCadastro' | 'dataAtualizacao' | 'ativo'>

export async function POST(request: Request) {
  try {
    const body: InstituicaoInput = await request.json();
    
    // Validações detalhadas
    if (!body.nome || !body.nome.trim()) {
      return NextResponse.json(
        { ok: false, error: 'Nome da instituição é obrigatório.' },
        { status: 400 }
      );
    }

    if (!body.tipo) {
      return NextResponse.json(
        { ok: false, error: 'Tipo da instituição é obrigatório.' },
        { status: 400 }
      );
    }

    if (!body.totalAlunos || body.totalAlunos <= 0) {
      return NextResponse.json(
        { ok: false, error: 'Total de alunos deve ser maior que zero.' },
        { status: 400 }
      );
    }

    // Validação de endereço
    if (!body.endereco?.logradouro?.trim() || 
        !body.endereco?.numero?.trim() || 
        !body.endereco?.bairro?.trim() ||
        !body.endereco?.cidade?.trim() ||
        !body.endereco?.estado?.trim() ||
        !body.endereco?.cep?.trim()) {
      return NextResponse.json(
        { ok: false, error: 'Todos os campos de endereço são obrigatórios (exceto complemento).' },
        { status: 400 }
      );
    }

    // Validação de alunos atípicos
    if (body.alunosAtipicos && body.alunosAtipicos.length > 0) {
      const totalAtipicos = body.alunosAtipicos.reduce((sum, a) => sum + a.quantidade, 0);
      if (totalAtipicos > body.totalAlunos) {
        return NextResponse.json(
          { ok: false, error: 'Total de alunos com restrições não pode ser maior que o total de alunos.' },
          { status: 400 }
        );
      }
    }

    // Limpa requests antigas
    cleanOldRequests();

    // Cria chave única
    const requestKey = `instituicao_${body.nome.trim().toLowerCase()}_${body.endereco.cep}`;
    
    // Verifica duplicação recente
    if (recentRequests.has(requestKey)) {
      const lastRequest = recentRequests.get(requestKey)!;
      const timeSinceLastRequest = Date.now() - lastRequest;
      
      if (timeSinceLastRequest < DUPLICATE_WINDOW) {
        return NextResponse.json(
          { ok: false, error: 'Requisição duplicada. Aguarde alguns segundos.' },
          { status: 429 }
        );
      }
    }

    // Registra a request
    recentRequests.set(requestKey, Date.now());
    
    const instituicao: Instituicao = {
      id: uuidv4(),
      ...body,
      nome: body.nome.trim(),
      endereco: {
        ...body.endereco,
        logradouro: body.endereco.logradouro.trim(),
        numero: body.endereco.numero.trim(),
        bairro: body.endereco.bairro.trim(),
        cidade: body.endereco.cidade.trim(),
        estado: body.endereco.estado.trim().toUpperCase(),
        cep: body.endereco.cep.trim(),
        complemento: body.endereco.complemento?.trim()
      },
      dataCadastro: new Date(),
      dataAtualizacao: new Date(),
      ativo: true
    };

    // Lê instituições existentes
    let instituicoes: Instituicao[] = [];
    try {
      const conteudoAtual = await fs.readFile(INSTITUICOES_PATH, 'utf-8');
      instituicoes = JSON.parse(conteudoAtual);
    } catch {
      console.log('[API] Criando novo arquivo de instituições');
    }

    // Verifica se já existe uma instituição com o mesmo nome e endereço
    const existe = instituicoes.some(i => 
      i.nome.trim().toLowerCase() === instituicao.nome.toLowerCase() && 
      i.endereco.cep === instituicao.endereco.cep &&
      i.ativo
    );

    if (existe) {
      return NextResponse.json(
        { ok: false, error: 'Já existe uma instituição com esse nome neste CEP.' },
        { status: 409 }
      );
    }

    // Adiciona e salva
    instituicoes.push(instituicao);
    await fs.writeFile(INSTITUICOES_PATH, JSON.stringify(instituicoes, null, 2), 'utf-8');

    return NextResponse.json({ ok: true, data: instituicao }, { status: 201 });
  } catch (error) {
    console.error('[API] Erro ao salvar instituição:', error);
    return NextResponse.json({ 
      ok: false, 
      error: error instanceof Error ? error.message : 'Erro ao salvar instituição' 
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const conteudo = await fs.readFile(INSTITUICOES_PATH, 'utf-8');
    const instituicoes: Instituicao[] = JSON.parse(conteudo);
    const instituicoesAtivas = instituicoes.filter((i: Instituicao) => i.ativo);
    
    return NextResponse.json({ ok: true, data: instituicoesAtivas }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: true, data: [] }, { status: 200 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, ...updates }: Partial<Instituicao> = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { ok: false, error: 'ID da instituição é obrigatório' },
        { status: 400 }
      );
    }

    let instituicoes: Instituicao[] = [];
    try {
      const conteudoAtual = await fs.readFile(INSTITUICOES_PATH, 'utf-8');
      instituicoes = JSON.parse(conteudoAtual);
    } catch {
      return NextResponse.json(
        { ok: false, error: 'Nenhuma instituição encontrada' },
        { status: 404 }
      );
    }

    const index = instituicoes.findIndex(i => i.id === id);
    if (index === -1) {
      return NextResponse.json(
        { ok: false, error: 'Instituição não encontrada' },
        { status: 404 }
      );
    }

    // Atualiza a instituição
    instituicoes[index] = {
      ...instituicoes[index],
      ...updates,
      id, // Garante que o ID não seja alterado
      dataAtualizacao: new Date()
    };

    await fs.writeFile(INSTITUICOES_PATH, JSON.stringify(instituicoes, null, 2), 'utf-8');

    return NextResponse.json({ ok: true, data: instituicoes[index] }, { status: 200 });
  } catch (error) {
    console.error('[API] Erro ao atualizar instituição:', error);
    return NextResponse.json({ 
      ok: false, 
      error: error instanceof Error ? error.message : 'Erro ao atualizar instituição' 
    }, { status: 500 });
  }
}