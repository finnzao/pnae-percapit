/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '@/components/Header';
import { ArrowLeft, Clock, Calendar, Utensils, Download, Edit, Share2 } from 'lucide-react';
import { Cardapio, RefeicaoCardapio } from '@/types';

export default function CardapioDetalhe() {
  const router = useRouter();
  const params = useParams();
  const [cardapio, setCardapio] = useState<Cardapio | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      carregarCardapio(params.id as string);
    }
  }, [params.id]);

  const carregarCardapio = async (id: string) => {
    try {
      const response = await fetch('/api/salvar-cardapio');
      const data = await response.json();

      if (data.ok) {
        const cardapioEncontrado = data.data.find((c: Cardapio) => c.id === id);
        if (cardapioEncontrado) {
          setCardapio(cardapioEncontrado);
        } else {
          setErro('Cardápio não encontrado');
        }
      } else {
        setErro('Erro ao carregar cardápio');
      }
    } catch (error) {
      console.error('Erro ao carregar cardápio:', error);
      setErro('Erro ao conectar com o servidor');
    } finally {
      setCarregando(false);
    }
  };

  const formatarData = (dataString: string | Date) => {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatarHora = (hora: string) => {
    return hora || '--:--';
  };

  const contarAlimentos = (refeicoes: RefeicaoCardapio[]) => {
    return refeicoes.reduce((total, refeicao) => total + refeicao.alimentos.length, 0);
  };

  const exportarCardapio = () => {
    if (!cardapio) return;

    const conteudo = `CARDÁPIO: ${cardapio.nome}\n` +
      `${cardapio.descricao ? `Descrição: ${cardapio.descricao}\n` : ''}` +
      `Data de criação: ${formatarData(cardapio.dataCadastro)}\n\n` +
      cardapio.refeicoes.map(refeicao =>
        `${refeicao.nome} - ${formatarHora(refeicao.horario || '')}\n` +
        refeicao.alimentos.map(alimento => `  • ${alimento.nome || 'Alimento'}`).join('\n')
      ).join('\n\n');

    const blob = new Blob([conteudo], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cardapio-${cardapio.nome.toLowerCase().replace(/\s+/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (carregando) {
    return (
      <div className="min-h-screen bg-[#FAFAF8]">
        <Header />
        <main className="page-container">
          <div className="flex justify-center items-center h-64">
            <p className="text-center text-gray-500">Carregando cardápio...</p>
          </div>
        </main>
      </div>
    );
  }

  if (erro || !cardapio) {
    return (
      <div className="min-h-screen bg-[#FAFAF8]">
        <Header />
        <main className="page-container">
          <button
            onClick={() => router.push('/cardapios')}
            className="flex items-center gap-2 text-[#4C6E5D] hover:text-[#6B7F66] mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar aos cardápios</span>
          </button>

          <div className="bg-red-50 border border-red-200 text-red-700 p-8 rounded-lg text-center">
            <p className="text-lg font-medium mb-4">{erro || 'Cardápio não encontrado'}</p>
            <button
              onClick={() => router.push('/cardapios')}
              className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
            >
              Voltar aos Cardápios
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <Header />

      <main className="page-container">
        {/* Navegação */}
        <button
          onClick={() => router.push('/cardapios')}
          className="flex items-center gap-2 text-[#4C6E5D] hover:text-[#6B7F66] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar aos cardápios</span>
        </button>

        {/* Cabeçalho do Cardápio */}
        <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-[#4C6E5D] mb-2">{cardapio.nome}</h1>
              {cardapio.descricao && (
                <p className="text-gray-600">{cardapio.descricao}</p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={exportarCardapio}
                className="p-2 text-gray-600 hover:text-[#4C6E5D] hover:bg-gray-50 rounded-lg transition"
                title="Exportar cardápio"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={() => router.push(`/cardapio/editar/${cardapio.id}`)}
                className="p-2 text-gray-600 hover:text-[#4C6E5D] hover:bg-gray-50 rounded-lg transition"
                title="Editar cardápio"
              >
                <Edit className="w-5 h-5" />
              </button>
              <button
                className="p-2 text-gray-600 hover:text-[#4C6E5D] hover:bg-gray-50 rounded-lg transition"
                title="Compartilhar cardápio"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Criado em {formatarData(cardapio.dataCadastro)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Utensils className="w-4 h-4" />
              <span>{cardapio.refeicoes.length} refeições</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{contarAlimentos(cardapio.refeicoes)} alimentos no total</span>
            </div>
          </div>
        </div>

        {/* Refeições */}
        <div className="space-y-4">
          {cardapio.refeicoes.map((refeicao, index) => (
            <div key={refeicao.id} className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-[#4C6E5D]">{refeicao.nome}</h2>
                {refeicao.horario && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{formatarHora(refeicao.horario)}</span>
                  </div>
                )}
              </div>

              {refeicao.alimentos.length === 0 ? (
                <p className="text-gray-400 text-center py-4">Nenhum alimento nesta refeição</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {refeicao.alimentos.map((alimento, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg"
                    >
                      <div className="w-2 h-2 bg-[#4C6E5D] rounded-full"></div>
                      <span className="font-medium">{alimento.nome || 'Alimento'}</span>
                      {alimento.quantidade > 0 && (
                        <span className="text-sm text-gray-500 ml-auto">
                          {alimento.quantidade} kg
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Ações */}
        <div className="flex justify-center gap-4 mt-8">
          <button
            onClick={() => router.push('/calcular')}
            className="px-6 py-3 bg-[#4C6E5D] text-white rounded-lg hover:bg-[#6B7F66] transition"
          >
            Calcular Quantidades
          </button>
          <button
            onClick={() => router.push('/cardapio')}
            className="px-6 py-3 border border-[#4C6E5D] text-[#4C6E5D] rounded-lg hover:bg-gray-50 transition"
          >
            Criar Novo Cardápio
          </button>
        </div>
      </main>
    </div>
  );
}