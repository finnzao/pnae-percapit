import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { Alimento } from '@/types';

const ALIMENTOS_PATH = path.resolve(process.cwd(), 'app/api/alimentos.json');

// Cache simples para evitar duplicações rápidas
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

export async function POST(request: Request) {
  try {
    const body: Alimento = await request.json();
    
    // Validação de campos obrigatórios
    if (!body.nome || !body.nome.trim()) {
      return NextResponse.json(
        { ok: false, error: 'Nome é obrigatório.' },
        { status: 400 }
      );
    }

    if (!body.fc || body.fc <= 0) {
      return NextResponse.json(
        { ok: false, error: 'Fator de Correção deve ser maior que zero.' },
        { status: 400 }
      );
    }

    if (!body.fcc || body.fcc <= 0) {
      return NextResponse.json(
        { ok: false, error: 'Fator de Cocção deve ser maior que zero.' },
        { status: 400 }
      );
    }

    // Limpa requests antigas
    cleanOldRequests();

    // Cria uma chave única baseada no nome do alimento
    const requestKey = `alimento_${body.nome.trim().toLowerCase()}`;
    
    // Verifica se houve uma request recente com o mesmo nome
    if (recentRequests.has(requestKey)) {
      const lastRequest = recentRequests.get(requestKey)!;
      const timeSinceLastRequest = Date.now() - lastRequest;
      
      if (timeSinceLastRequest < DUPLICATE_WINDOW) {
        return NextResponse.json(
          { ok: false, error: 'Requisição duplicada. Aguarde alguns segundos.' },
          { status: 429 } // Too Many Requests
        );
      }
    }

    // Registra a request atual
    recentRequests.set(requestKey, Date.now());
    
    // Lê o conteúdo atual do arquivo
    let alimentos: Alimento[] = [];
    try {
      const conteudoAtual = await fs.readFile(ALIMENTOS_PATH, 'utf-8');
      alimentos = JSON.parse(conteudoAtual);
    } catch {
      // Arquivo não existe ainda, será criado
    }

    // Verifica se já existe um alimento com o mesmo nome (case insensitive)
    const nomeNormalizado = body.nome.trim().toLowerCase();
    const existe = alimentos.some(a => 
      a.nome.trim().toLowerCase() === nomeNormalizado
    );

    if (existe) {
      return NextResponse.json(
        { ok: false, error: 'Já existe um alimento com esse nome.' },
        { status: 409 } // Conflict
      );
    }

    // Adiciona o novo alimento com timestamp
    const novoAlimento = {
      ...body,
      nome: body.nome.trim(),
      _createdAt: new Date().toISOString()
    };

    alimentos.push(novoAlimento);

    // Salva no arquivo
    await fs.writeFile(ALIMENTOS_PATH, JSON.stringify(alimentos, null, 2), 'utf-8');

    return NextResponse.json({ ok: true, data: novoAlimento }, { status: 201 });
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