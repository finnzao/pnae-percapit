import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Cardapio } from '@/types';

const CARDAPIOS_PATH = path.resolve(process.cwd(), 'app/api/cardapios.json');

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

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface CardapioInput extends Omit<Cardapio, 'id' | 'dataCadastro' | 'dataAtualizacao' | 'ativo'> {}

export async function POST(request: Request) {
  try {
    const body: CardapioInput = await request.json();
    
    // Validações
    if (!body.nome || !body.nome.trim()) {
      return NextResponse.json(
        { ok: false, error: 'Nome do cardápio é obrigatório.' },
        { status: 400 }
      );
    }

    if (!body.refeicoes || body.refeicoes.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'O cardápio deve ter pelo menos uma refeição.' },
        { status: 400 }
      );
    }

    // Valida cada refeição
    for (const refeicao of body.refeicoes) {
      if (!refeicao.nome || !refeicao.nome.trim()) {
        return NextResponse.json(
          { ok: false, error: 'Todas as refeições devem ter nome.' },
          { status: 400 }
        );
      }
      if (!refeicao.alimentos || refeicao.alimentos.length === 0) {
        return NextResponse.json(
          { ok: false, error: `A refeição "${refeicao.nome}" deve ter pelo menos um alimento.` },
          { status: 400 }
        );
      }
    }

    // Limpa requests antigas
    cleanOldRequests();

    // Cria chave única baseada no nome e conteúdo
    const contentHash = JSON.stringify({
      nome: body.nome.trim().toLowerCase(),
      refeicoes: body.refeicoes.length,
      alimentos: body.refeicoes.reduce((acc, r) => acc + r.alimentos.length, 0)
    });
    const requestKey = `cardapio_${contentHash}`;
    
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
    
    const cardapio: Cardapio = {
      id: uuidv4(),
      ...body,
      nome: body.nome.trim(),
      dataCadastro: new Date(),
      dataAtualizacao: new Date(),
      ativo: true
    };

    // Lê cardápios existentes
    let cardapios: Cardapio[] = [];
    try {
      const conteudoAtual = await fs.readFile(CARDAPIOS_PATH, 'utf-8');
      cardapios = JSON.parse(conteudoAtual);
    } catch {
      console.log('[API] Criando novo arquivo de cardápios');
    }

    // Verifica se já existe cardápio muito similar criado recentemente (últimos 5 minutos)
    const cincoMinutosAtras = new Date(Date.now() - 5 * 60 * 1000);
    const cardapioSimilarRecente = cardapios.find(c => {
      const dataCadastro = new Date(c.dataCadastro);
      return c.nome.trim().toLowerCase() === cardapio.nome.toLowerCase() &&
             c.ativo &&
             dataCadastro > cincoMinutosAtras;
    });

    if (cardapioSimilarRecente) {
      return NextResponse.json(
        { ok: false, error: 'Um cardápio com este nome foi criado recentemente.' },
        { status: 409 }
      );
    }

    // Adiciona e salva
    cardapios.push(cardapio);
    await fs.writeFile(CARDAPIOS_PATH, JSON.stringify(cardapios, null, 2), 'utf-8');

    return NextResponse.json({ ok: true, data: cardapio }, { status: 201 });
  } catch (error) {
    console.error('[API] Erro ao salvar cardápio:', error);
    return NextResponse.json({ 
      ok: false, 
      error: error instanceof Error ? error.message : 'Erro ao salvar cardápio' 
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const conteudo = await fs.readFile(CARDAPIOS_PATH, 'utf-8');
    const cardapios: Cardapio[] = JSON.parse(conteudo);
    const cardapiosAtivos = cardapios.filter((c: Cardapio) => c.ativo);
    
    return NextResponse.json({ ok: true, data: cardapiosAtivos }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: true, data: [] }, { status: 200 });
  }
}