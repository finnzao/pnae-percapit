import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { Alimento } from '@/types';

const ALIMENTOS_PATH = path.resolve(process.cwd(), 'app/api/alimentos.json');

export async function POST(request: Request) {
  try {
    const body: Alimento = await request.json();
    
    // Lê o conteúdo atual do arquivo
    let alimentos: Alimento[] = [];
    try {
      const conteudoAtual = await fs.readFile(ALIMENTOS_PATH, 'utf-8');
      alimentos = JSON.parse(conteudoAtual);
    } catch {
      // Arquivo não existe ainda, será criado
    }

    // Verifica se já existe um alimento com o mesmo nome
    const existe = alimentos.some(a => 
      a.nome.toLowerCase() === body.nome.toLowerCase()
    );

    if (existe) {
      return NextResponse.json(
        { ok: false, error: 'Já existe um alimento com esse nome.' },
        { status: 400 }
      );
    }

    // Adiciona o novo alimento
    alimentos.push(body);

    // Salva no arquivo
    await fs.writeFile(ALIMENTOS_PATH, JSON.stringify(alimentos, null, 2), 'utf-8');

    return NextResponse.json({ ok: true, data: body }, { status: 200 });
  } catch (error) {
    console.error('[API] Erro ao salvar alimento:', error);
    return NextResponse.json(
      { ok: false, error: 'Erro ao salvar alimento' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const conteudo = await fs.readFile(ALIMENTOS_PATH, 'utf-8');
    const alimentos: Alimento[] = JSON.parse(conteudo);
    return NextResponse.json({ ok: true, data: alimentos }, { status: 200 });
  } catch {
    // Se não existir arquivo, retorna array vazio
    return NextResponse.json({ ok: true, data: [] }, { status: 200 });
  }
}