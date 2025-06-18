import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { GuiaAbastecimento } from '@/types';

const GUIAS_PATH = path.resolve(process.cwd(), 'app/api/guias-abastecimento.json');

// Cache para evitar duplicações
const recentRequests = new Map<string, number>();
const DUPLICATE_WINDOW = 3000; // 3 segundos para guias (processo mais demorado)

function cleanOldRequests() {
  const now = Date.now();
  for (const [key, timestamp] of recentRequests.entries()) {
    if (now - timestamp > DUPLICATE_WINDOW) {
      recentRequests.delete(key);
    }
  }
}

type GuiaInput = Omit<GuiaAbastecimento, 'id' | 'versao' | 'dataGeracao'>

export async function POST(request: Request) {
  try {
    const body: GuiaInput = await request.json();
    
    // Validações
    if (!body.instituicaoId) {
      return NextResponse.json(
        { ok: false, error: 'Instituição é obrigatória.' },
        { status: 400 }
      );
    }

    if (!body.dataInicio || !body.dataFim) {
      return NextResponse.json(
        { ok: false, error: 'Período (data inicial e final) é obrigatório.' },
        { status: 400 }
      );
    }

    const dataInicio = new Date(body.dataInicio);
    const dataFim = new Date(body.dataFim);
    
    if (dataInicio > dataFim) {
      return NextResponse.json(
        { ok: false, error: 'Data inicial não pode ser maior que a data final.' },
        { status: 400 }
      );
    }

    if (!body.cardapiosDiarios || body.cardapiosDiarios.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Deve haver pelo menos um cardápio diário.' },
        { status: 400 }
      );
    }

    // Valida se todos os dias têm cardápio
    const diasSemCardapio = body.cardapiosDiarios.filter(d => !d.cardapioId);
    if (diasSemCardapio.length > 0) {
      return NextResponse.json(
        { ok: false, error: `${diasSemCardapio.length} dias estão sem cardápio definido.` },
        { status: 400 }
      );
    }

    if (!body.usuarioGeracao) {
      return NextResponse.json(
        { ok: false, error: 'Usuário é obrigatório.' },
        { status: 400 }
      );
    }

    // Limpa requests antigas
    cleanOldRequests();

    // Cria chave única baseada na instituição e período
    const requestKey = `guia_${body.instituicaoId}_${dataInicio.getTime()}_${dataFim.getTime()}`;
    
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
    
    const guia: GuiaAbastecimento = {
      id: uuidv4(),
      ...body,
      versao: 1,
      dataGeracao: new Date(),
    };

    // Lê guias existentes
    let guias: GuiaAbastecimento[] = [];
    try {
      const conteudoAtual = await fs.readFile(GUIAS_PATH, 'utf-8');
      guias = JSON.parse(conteudoAtual);
    } catch {
      console.log('[API] Criando novo arquivo de guias de abastecimento');
    }

    // Verifica se já existe uma guia para o mesmo período e instituição
    const guiaExistente = guias.find(g => {
      const gInicio = new Date(g.dataInicio);
      const gFim = new Date(g.dataFim);
      return g.instituicaoId === body.instituicaoId &&
             gInicio.getTime() === dataInicio.getTime() &&
             gFim.getTime() === dataFim.getTime() &&
             g.status !== 'Rascunho'; // Permite múltiplos rascunhos
    });

    if (guiaExistente) {
      return NextResponse.json(
        { ok: false, error: 'Já existe uma guia finalizada para esta instituição neste período.' },
        { status: 409 }
      );
    }

    // Adiciona e salva
    guias.push(guia);
    await fs.writeFile(GUIAS_PATH, JSON.stringify(guias, null, 2), 'utf-8');

    return NextResponse.json({ ok: true, data: guia }, { status: 201 });
  } catch (error) {
    console.error('[API] Erro ao salvar guia de abastecimento:', error);
    return NextResponse.json({ 
      ok: false, 
      error: error instanceof Error ? error.message : 'Erro ao salvar guia de abastecimento' 
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const conteudo = await fs.readFile(GUIAS_PATH, 'utf-8');
    const guias: GuiaAbastecimento[] = JSON.parse(conteudo);
    
    // Ordena por data de geração mais recente
    guias.sort((a, b) => new Date(b.dataGeracao).getTime() - new Date(a.dataGeracao).getTime());
    
    return NextResponse.json({ ok: true, data: guias }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: true, data: [] }, { status: 200 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, ...updates }: Partial<GuiaAbastecimento> = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { ok: false, error: 'ID da guia é obrigatório' },
        { status: 400 }
      );
    }

    // Validações para mudança de status
    if (updates.status && !['Rascunho', 'Finalizado', 'Distribuído'].includes(updates.status)) {
      return NextResponse.json(
        { ok: false, error: 'Status inválido.' },
        { status: 400 }
      );
    }

    let guias: GuiaAbastecimento[] = [];
    try {
      const conteudoAtual = await fs.readFile(GUIAS_PATH, 'utf-8');
      guias = JSON.parse(conteudoAtual);
    } catch {
      return NextResponse.json(
        { ok: false, error: 'Nenhuma guia encontrada' },
        { status: 404 }
      );
    }

    const index = guias.findIndex(g => g.id === id);
    if (index === -1) {
      return NextResponse.json(
        { ok: false, error: 'Guia não encontrada' },
        { status: 404 }
      );
    }

    // Atualiza a guia
    guias[index] = {
      ...guias[index],
      ...updates,
      id, // Garante que o ID não seja alterado
      versao: guias[index].versao + 1,
      dataGeracao: new Date()
    };

    await fs.writeFile(GUIAS_PATH, JSON.stringify(guias, null, 2), 'utf-8');

    return NextResponse.json({ ok: true, data: guias[index] }, { status: 200 });
  } catch (error) {
    console.error('[API] Erro ao atualizar guia:', error);
    return NextResponse.json({ 
      ok: false, 
      error: error instanceof Error ? error.message : 'Erro ao atualizar guia' 
    }, { status: 500 });
  }
}