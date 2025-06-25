import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { Alimento } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const ALIMENTOS_PATH = path.resolve(process.cwd(), 'app/api/alimentos.json');

// GET - Listar todos os alimentos
export async function GET() {
  try {
    const conteudo = await fs.readFile(ALIMENTOS_PATH, 'utf-8');
    const alimentos: Alimento[] = JSON.parse(conteudo);
    return NextResponse.json({ ok: true, data: alimentos }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: true, data: [] }, { status: 200 });
  }
}

// POST - Criar novo alimento
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { id: _, ...dadosAlimento } = body;

    // Validação
    if (!dadosAlimento.nome || !dadosAlimento.nome.trim()) {
      return NextResponse.json(
        { ok: false, error: 'Nome é obrigatório.' },
        { status: 400 }
      );
    }

    if (!dadosAlimento.fc || dadosAlimento.fc <= 0) {
      return NextResponse.json(
        { ok: false, error: 'Fator de Correção deve ser maior que zero.' },
        { status: 400 }
      );
    }

    if (!dadosAlimento.fcc || dadosAlimento.fcc <= 0) {
      return NextResponse.json(
        { ok: false, error: 'Fator de Cocção deve ser maior que zero.' },
        { status: 400 }
      );
    }

    // Lê alimentos existentes
    let alimentos: Alimento[] = [];
    try {
      const conteudoAtual = await fs.readFile(ALIMENTOS_PATH, 'utf-8');
      alimentos = JSON.parse(conteudoAtual);
    } catch {
      // Arquivo não existe ainda
    }

    // Verifica duplicação por nome
    const existe = alimentos.some(a =>
      a.nome.trim().toLowerCase() === dadosAlimento.nome.trim().toLowerCase()
    );

    if (existe) {
      return NextResponse.json(
        { ok: false, error: 'Já existe um alimento com esse nome.' },
        { status: 409 }
      );
    }

    // Adiciona com ID único
    const novoAlimento: Alimento = {
      id: uuidv4(),
      ...dadosAlimento,
      nome: dadosAlimento.nome.trim()
    };

    alimentos.push(novoAlimento);

    // Salva
    await fs.writeFile(ALIMENTOS_PATH, JSON.stringify(alimentos, null, 2), 'utf-8');

    return NextResponse.json({ ok: true, data: novoAlimento }, { status: 201 });
  } catch (error) {
    console.error('[API] Erro ao criar alimento:', error);
    return NextResponse.json(
      { ok: false, error: 'Erro ao criar alimento' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar alimento
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...dadosAtualizados } = body;

    if (!id) {
      return NextResponse.json(
        { ok: false, error: 'ID é obrigatório' },
        { status: 400 }
      );
    }

    // Validações dos dados atualizados
    if (dadosAtualizados.nome && !dadosAtualizados.nome.trim()) {
      return NextResponse.json(
        { ok: false, error: 'Nome não pode estar vazio' },
        { status: 400 }
      );
    }

    // Lê alimentos existentes
    let alimentos: Alimento[] = [];
    try {
      const conteudoAtual = await fs.readFile(ALIMENTOS_PATH, 'utf-8');
      alimentos = JSON.parse(conteudoAtual);
    } catch {
      return NextResponse.json(
        { ok: false, error: 'Nenhum alimento encontrado' },
        { status: 404 }
      );
    }

    // Encontra o índice por ID
    const index = alimentos.findIndex(a => a.id === id);

    if (index === -1) {
      return NextResponse.json(
        { ok: false, error: 'Alimento não encontrado' },
        { status: 404 }
      );
    }

    // Se o nome mudou, verifica duplicação
    if (dadosAtualizados.nome &&
      dadosAtualizados.nome.trim().toLowerCase() !== alimentos[index].nome.toLowerCase()) {
      const existe = alimentos.some((a, i) =>
        i !== index && a.nome.trim().toLowerCase() === dadosAtualizados.nome.trim().toLowerCase()
      );

      if (existe) {
        return NextResponse.json(
          { ok: false, error: 'Já existe um alimento com esse nome.' },
          { status: 409 }
        );
      }
    }

    // Atualiza mantendo o ID
    alimentos[index] = {
      ...alimentos[index],
      ...dadosAtualizados,
      id: alimentos[index].id, // Mantém o ID original
      nome: dadosAtualizados.nome ? dadosAtualizados.nome.trim() : alimentos[index].nome
    };

    // Salva
    await fs.writeFile(ALIMENTOS_PATH, JSON.stringify(alimentos, null, 2), 'utf-8');

    return NextResponse.json({ ok: true, data: alimentos[index] }, { status: 200 });
  } catch (error) {
    console.error('[API] Erro ao atualizar alimento:', error);
    return NextResponse.json(
      { ok: false, error: 'Erro ao atualizar alimento' },
      { status: 500 }
    );
  }
}

// DELETE - Deletar alimento
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { ok: false, error: 'ID é obrigatório' },
        { status: 400 }
      );
    }

    // Lê alimentos existentes
    let alimentos: Alimento[] = [];
    try {
      const conteudoAtual = await fs.readFile(ALIMENTOS_PATH, 'utf-8');
      alimentos = JSON.parse(conteudoAtual);
    } catch {
      return NextResponse.json(
        { ok: false, error: 'Nenhum alimento encontrado' },
        { status: 404 }
      );
    }

    // Encontra o alimento para pegar o nome (para log/auditoria se necessário)
    const alimentoParaDeletar = alimentos.find(a => a.id === id);

    if (!alimentoParaDeletar) {
      return NextResponse.json(
        { ok: false, error: 'Alimento não encontrado' },
        { status: 404 }
      );
    }

    // Filtra removendo o alimento por ID
    const alimentosFiltrados = alimentos.filter(a => a.id !== id);

    // Salva
    await fs.writeFile(ALIMENTOS_PATH, JSON.stringify(alimentosFiltrados, null, 2), 'utf-8');

    // Retorna informações sobre o alimento deletado
    return NextResponse.json({
      ok: true,
      deletedItem: {
        id: alimentoParaDeletar.id,
        nome: alimentoParaDeletar.nome
      }
    }, { status: 200 });
  } catch (error) {
    console.error('[API] Erro ao deletar alimento:', error);
    return NextResponse.json(
      { ok: false, error: 'Erro ao deletar alimento' },
      { status: 500 }
    );
  }
}