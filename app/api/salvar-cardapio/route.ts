import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const CARDAPIOS_PATH = path.resolve(process.cwd(), 'app/api/cardapios.json');

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const cardapio = {
      id: uuidv4(),
      ...body,
      dataCadastro: new Date(),
      dataAtualizacao: new Date(),
      ativo: true
    };

    // Lê cardápios existentes
    let cardapios: any[] = [];
    try {
      const conteudoAtual = await fs.readFile(CARDAPIOS_PATH, 'utf-8');
      cardapios = JSON.parse(conteudoAtual);
    } catch (err) {
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
    const cardapios = JSON.parse(conteudo);
    const cardapiosAtivos = cardapios.filter((c: any) => c.ativo);
    
    return NextResponse.json({ ok: true, data: cardapiosAtivos }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ ok: true, data: [] }, { status: 200 });
  }
}