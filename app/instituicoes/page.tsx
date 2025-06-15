'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RestricaoAlimentar, RestricaoAlimentarDescricao, TipoInstituicao, Instituicao, AlunoAtipico } from '@/types';

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
      <main className="bg-fundo text-texto min-h-screen py-12 px-4 font-sans">
        <div className="max-w-7xl mx-auto">
          <p className="text-center">Carregando instituições...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-fundo text-texto min-h-screen py-12 px-4 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Instituições Cadastradas</h1>
          <button
            onClick={() => router.push('/instituicoes/cadastrar')}
            className="px-6 py-2 bg-botao text-white rounded-md hover:opacity-90 transition"
          >
            Nova Instituição
          </button>
        </div>

        {erro && (
          <div className="text-red-700 bg-red-100 border border-red-400 p-3 rounded mb-4">
            {erro}
          </div>
        )}

        {instituicoes.length === 0 ? (
          <div className="bg-cartao p-8 rounded-2xl shadow-lg text-center">
            <p className="text-gray-600 mb-4">Nenhuma instituição cadastrada ainda.</p>
            <button
              onClick={() => router.push('/instituicoes/cadastrar')}
              className="px-6 py-2 bg-acento text-black rounded-md hover:opacity-90 transition"
            >
              Cadastrar Primeira Instituição
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {instituicoes.map((instituicao) => (
              <div
                key={instituicao.id}
                className="bg-cartao p-6 rounded-2xl shadow-lg border border-acento hover:shadow-xl transition cursor-pointer"
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
                  <div className="mt-4 pt-4 border-t border-gray-300">
                    <p className="text-sm font-medium mb-2">Restrições alimentares:</p>
                    <div className="flex flex-wrap gap-1">
                      {instituicao.alunosAtipicos.map((atipico, index) => (
                        <span
                          key={index}
                          className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded"
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

        <div className="mt-8 flex justify-center">
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-gray-300 text-black rounded-md hover:bg-gray-400 transition"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    </main>
  );
}