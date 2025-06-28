'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { ArrowLeft, Plus, Calendar, Clock, Utensils } from 'lucide-react';
import { Cardapio, RefeicaoCardapio } from '@/types';

export default function CardapiosPage() {
  const router = useRouter();
  const [cardapios, setCardapios] = useState<Cardapio[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarCardapios();
  }, []);

  const carregarCardapios = async () => {
    try {
      const response = await fetch('/api/salvar-cardapio');
      const data = await response.json();

      if (data.ok) {
        setCardapios(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar cardápios:', error);
    } finally {
      setCarregando(false);
    }
  };

  const formatarData = (dataString: string | Date) => {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
  };

  const contarAlimentos = (refeicoes: RefeicaoCardapio[]) => {
    return refeicoes.reduce((total, refeicao) => total + refeicao.alimentos.length, 0);
  };

  if (carregando) {
    return (
      <div className="min-h-screen bg-[#FAFAF8]">
        <Header />
        <main className="page-container">
          <div className="flex justify-center items-center h-64">
            <p className="text-center text-gray-500">Carregando cardápios...</p>
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
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-[#4C6E5D] hover:text-[#6B7F66] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao início</span>
        </button>

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-[#4C6E5D]">Cardápios</h1>
          <button
            onClick={() => router.push('/cardapio')}
            className="px-4 py-2 bg-[#4C6E5D] text-white rounded-md hover:bg-[#6B7F66] transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Novo Cardápio
          </button>
        </div>

        {cardapios.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow-sm text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <Utensils className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-600 mb-6">Nenhum cardápio cadastrado ainda.</p>
            <button
              onClick={() => router.push('/cardapio')}
              className="px-6 py-2 bg-[#4C6E5D] text-white rounded-md hover:bg-[#6B7F66] transition"
            >
              Criar Primeiro Cardápio
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cardapios.map((cardapio) => (
              <div
                key={cardapio.id}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer"
                onClick={() => router.push(`/cardapios/${cardapio.id}`)}
              >
                <h2 className="text-xl font-bold mb-2">{cardapio.nome}</h2>
                {cardapio.descricao && (
                  <p className="text-sm text-gray-600 mb-4">{cardapio.descricao}</p>
                )}

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Utensils className="w-4 h-4" />
                    <span>{cardapio.refeicoes.length} refeições</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{contarAlimentos(cardapio.refeicoes)} alimentos</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Criado em {formatarData(cardapio.dataCadastro)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}