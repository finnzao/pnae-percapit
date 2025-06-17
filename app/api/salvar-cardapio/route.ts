import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Cardapio } from '@/types';

const CARDAPIOS_PATH = path.resolve(process.cwd(), 'app/api/cardapios.json');

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface CardapioInput extends Omit<Cardapio, 'id' | 'dataCadastro' | 'dataAtualizacao' | 'ativo'> {}

export async function POST(request: Request) {
  try {
    const body: CardapioInput = await request.json();
    
    const cardapio: Cardapio = {
      id: uuidv4(),
      ...body,
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

    // Adiciona e salva
    cardapios.push(cardapio);
    await fs.writeFile(CARDAPIOS_PATH, JSON.stringify(cardapios, null, 2), 'utf-8');

    return NextResponse.json({ ok: true, data: cardapio }, { status: 200 });
  } catch (error) {
    console.error('[API] Erro ao salvar cardápio:', error);
    return NextResponse.json({ 
      ok: false, 
      error: error instanceof Error ? error.message : 'Erro ao salvar cardápio' 
    }, { status: 400 });
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