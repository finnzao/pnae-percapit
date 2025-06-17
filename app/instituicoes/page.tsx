'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RestricaoAlimentar, RestricaoAlimentarDescricao, TipoInstituicao, Instituicao, AlunoAtipico } from '@/types';
import Header from '@/components/Header';
import { ArrowLeft, Building2, Plus } from 'lucide-react';

export default function InstituicoesPage() {
  const router = useRouter();
  const [instituicoes, setInstituicoes] = useState<Instituicao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    carregarInstituicoes();
  }, []);

  const carregarInstituicoes = async () => {
    try {
      const response = await fetch('/api/salvar-instituicao');
      const data = await response.json();
      
      if (data.ok) {
        setInstituicoes(data.data);
      } else {
        setErro('Erro ao carregar instituições');
      }
    } catch (error) {
      setErro('Erro ao conectar com o servidor');
    } finally {
      setCarregando(false);
    }
  };

  const calcularAlunosComRestricao = (alunosAtipicos: AlunoAtipico[]) => {
    return alunosAtipicos.reduce((total, atipico) => total + atipico.quantidade, 0);
  };

  if (carregando) {
    return (
      <div className="min-h-screen bg-[#FAFAF8]">
        <Header />
        <main className="page-container">
          <div className="flex justify-center items-center h-64">
            <p className="text-center text-gray-500">Carregando instituições...</p>
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
          <h1 className="text-3xl font-bold text-[#4C6E5D]">Instituições</h1>
          <button
            onClick={() => router.push('/instituicoes/cadastrar')}
            className="px-4 py-2 bg-[#4C6E5D] text-white rounded-md hover:bg-[#6B7F66] transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nova Instituição
          </button>
        </div>

        {erro && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
            {erro}
          </div>
        )}

        {instituicoes.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow-sm text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <Building2 className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-600 mb-6">Nenhuma instituição cadastrada ainda.</p>
            <button
              onClick={() => router.push('/instituicoes/cadastrar')}
              className="px-6 py-2 bg-[#4C6E5D] text-white rounded-md hover:bg-[#6B7F66] transition"
            >
              Cadastrar Primeira Instituição
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {instituicoes.map((instituicao) => (
              <div
                key={instituicao.id}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer"
                onClick={() => router.push(`/instituicoes/${instituicao.id}`)}
              >
                <h2 className="text-xl font-bold mb-2">{instituicao.nome}</h2>
                <p className="text-sm text-gray-600 mb-4">{instituicao.tipo}</p>
                
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Total de alunos:</span> {instituicao.totalAlunos}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Alunos com restrições:</span>{' '}
                    {calcularAlunosComRestricao(instituicao.alunosAtipicos)}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Endereço:</span>{' '}
                    {instituicao.endereco.bairro}, {instituicao.endereco.cidade}/{instituicao.endereco.estado}
                  </p>
                </div>

                {instituicao.alunosAtipicos.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm font-medium mb-2">Restrições alimentares:</p>
                    <div className="flex flex-wrap gap-1">
                      {instituicao.alunosAtipicos.map((atipico, index) => (
                        <span
                          key={index}
                          className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded"
                        >
                          {atipico.restricaoNome}: {atipico.quantidade}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}