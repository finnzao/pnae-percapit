'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RestricaoAlimentar, RestricaoAlimentarDescricao, TipoInstituicao, AlunoAtipico } from '@/types';
import Header from '@/components/Header';
import { ArrowLeft } from 'lucide-react';

interface FormState {
  nome: string;
  tipo: TipoInstituicao;
  endereco: {
    logradouro: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
  };
  totalAlunos: string;
  alunosAtipicos: AlunoAtipico[];
}

export default function CadastrarInstituicaoPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    nome: '',
    tipo: 'Escola Municipal',
    endereco: {
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
      cep: '',
    },
    totalAlunos: '',
    alunosAtipicos: [],
  });

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  const atualizarCampo = <K extends keyof FormState>(campo: K, valor: FormState[K]) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  const atualizarEndereco = <K extends keyof FormState['endereco']>(
    campo: K,
    valor: FormState['endereco'][K]
  ) => {
    setForm((prev) => ({
      ...prev,
      endereco: { ...prev.endereco, [campo]: valor },
    }));
  };

  const formatarCEP = (valor: string) => {
    const apenasNumeros = valor.replace(/\D/g, '');
    if (apenasNumeros.length <= 5) return apenasNumeros;
    return `${apenasNumeros.slice(0, 5)}-${apenasNumeros.slice(5, 8)}`;
  };

  const adicionarRestricao = () => {
    const novaRestricao: AlunoAtipico = {
      restricaoId: RestricaoAlimentar.ALERGICO_GLUTEN,
      restricaoNome: RestricaoAlimentarDescricao[RestricaoAlimentar.ALERGICO_GLUTEN],
      quantidade: 0,
    };
    setForm((prev) => ({
      ...prev,
      alunosAtipicos: [...prev.alunosAtipicos, novaRestricao],
    }));
  };

  const removerRestricao = (index: number) => {
    setForm((prev) => ({
      ...prev,
      alunosAtipicos: prev.alunosAtipicos.filter((_, i) => i !== index),
    }));
  };

  const atualizarRestricao = (index: number, campo: keyof AlunoAtipico, valor: any) => {
    setForm((prev) => {
      const novasRestricoes = [...prev.alunosAtipicos];
      if (campo === 'restricaoId') {
        novasRestricoes[index] = {
          ...novasRestricoes[index],
          restricaoId: valor,
          restricaoNome: RestricaoAlimentarDescricao[valor as RestricaoAlimentar],
        };
      } else {
        novasRestricoes[index] = {
          ...novasRestricoes[index],
          [campo]: valor,
        };
      }
      return { ...prev, alunosAtipicos: novasRestricoes };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setSucesso(false);
    setSalvando(true);

    try {
      // Validações básicas
      if (!form.nome.trim()) {
        throw new Error('Nome da instituição é obrigatório');
      }

      if (!form.totalAlunos || parseInt(form.totalAlunos) <= 0) {
        throw new Error('Total de alunos deve ser maior que zero');
      }

      // Validar soma de alunos com restrições
      const totalComRestricoes = form.alunosAtipicos.reduce(
        (total, atipico) => total + atipico.quantidade,
        0
      );

      if (totalComRestricoes > parseInt(form.totalAlunos)) {
        throw new Error('Total de alunos com restrições não pode ser maior que o total de alunos');
      }

      const payload = {
        ...form,
        totalAlunos: parseInt(form.totalAlunos),
        endereco: {
          ...form.endereco,
          complemento: form.endereco.complemento || undefined,
        },
      };

      const response = await fetch('/api/salvar-instituicao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao salvar instituição');
      }

      setSucesso(true);
      setTimeout(() => {
        router.push('/instituicoes');
      }, 2000);
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <Header />
      
      <main className="page-container">
        {/* Navegação */}
        <button
          onClick={() => router.push('/instituicoes')}
          className="flex items-center gap-2 text-[#4C6E5D] hover:text-[#6B7F66] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Instituições</span>
        </button>
        
        <div className="card-container">
          <h1 className="text-2xl font-bold mb-6 text-center text-[#4C6E5D]">Cadastrar Nova Instituição</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-[#4C6E5D]">Informações Básicas</h2>
              
              <div className="flex flex-col space-y-1">
                <label htmlFor="nome" className="text-sm font-medium">Nome da Instituição</label>
                <input
                  id="nome"
                  className="border border-gray-200 p-3 rounded bg-white"
                  value={form.nome}
                  onChange={(e) => atualizarCampo('nome', e.target.value)}
                  required
                  placeholder="Ex: Escola Municipal José Silva"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label htmlFor="tipo" className="text-sm font-medium">Tipo de Instituição</label>
                <select
                  id="tipo"
                  className="border border-gray-200 p-3 rounded bg-white"
                  value={form.tipo}
                  onChange={(e) => atualizarCampo('tipo', e.target.value as TipoInstituicao)}
                  required
                >
                  <option value="Escola Municipal">Escola Municipal</option>
                  <option value="Creche">Creche</option>
                  <option value="Escola Estadual">Escola Estadual</option>
                  <option value="Centro de Educação Infantil">Centro de Educação Infantil</option>
                </select>
              </div>

              <div className="flex flex-col space-y-1">
                <label htmlFor="totalAlunos" className="text-sm font-medium">Total de Alunos</label>
                <input
                  id="totalAlunos"
                  type="number"
                  className="border border-gray-200 p-3 rounded bg-white"
                  value={form.totalAlunos}
                  onChange={(e) => atualizarCampo('totalAlunos', e.target.value)}
                  required
                  placeholder="Ex: 250"
                  min="1"
                />
              </div>
            </div>

            {/* Endereço */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-[#4C6E5D]">Endereço</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <label htmlFor="logradouro" className="text-sm font-medium">Logradouro</label>
                  <input
                    id="logradouro"
                    className="border border-gray-200 p-3 rounded bg-white"
                    value={form.endereco.logradouro}
                    onChange={(e) => atualizarEndereco('logradouro', e.target.value)}
                    required
                    placeholder="Ex: Rua das Flores"
                  />
                </div>

                <div className="flex flex-col space-y-1">
                  <label htmlFor="numero" className="text-sm font-medium">Número</label>
                  <input
                    id="numero"
                    className="border border-gray-200 p-3 rounded bg-white"
                    value={form.endereco.numero}
                    onChange={(e) => atualizarEndereco('numero', e.target.value)}
                    required
                    placeholder="Ex: 123"
                  />
                </div>
              </div>

              <div className="flex flex-col space-y-1">
                <label htmlFor="complemento" className="text-sm font-medium">Complemento</label>
                <input
                  id="complemento"
                  className="border border-gray-200 p-3 rounded bg-white"
                  value={form.endereco.complemento}
                  onChange={(e) => atualizarEndereco('complemento', e.target.value)}
                  placeholder="Ex: Fundos"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col space-y-1">
                  <label htmlFor="bairro" className="text-sm font-medium">Bairro</label>
                  <input
                    id="bairro"
                    className="border border-gray-200 p-3 rounded bg-white"
                    value={form.endereco.bairro}
                    onChange={(e) => atualizarEndereco('bairro', e.target.value)}
                    required
                    placeholder="Ex: Centro"
                  />
                </div>

                <div className="flex flex-col space-y-1">
                  <label htmlFor="cidade" className="text-sm font-medium">Cidade</label>
                  <input
                    id="cidade"
                    className="border border-gray-200 p-3 rounded bg-white"
                    value={form.endereco.cidade}
                    onChange={(e) => atualizarEndereco('cidade', e.target.value)}
                    required
                    placeholder="Ex: São Paulo"
                  />
                </div>

                <div className="flex flex-col space-y-1">
                  <label htmlFor="estado" className="text-sm font-medium">Estado</label>
                  <input
                    id="estado"
                    className="border border-gray-200 p-3 rounded bg-white"
                    value={form.endereco.estado}
                    onChange={(e) => atualizarEndereco('estado', e.target.value.toUpperCase().slice(0, 2))}
                    required
                    placeholder="Ex: SP"
                    maxLength={2}
                  />
                </div>
              </div>

              <div className="flex flex-col space-y-1">
                <label htmlFor="cep" className="text-sm font-medium">CEP</label>
                <input
                  id="cep"
                  className="border border-gray-200 p-3 rounded bg-white"
                  value={form.endereco.cep}
                  onChange={(e) => atualizarEndereco('cep', formatarCEP(e.target.value))}
                  required
                  placeholder="Ex: 12345-678"
                  maxLength={9}
                />
              </div>
            </div>

            {/* Alunos com Restrições */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-[#4C6E5D]">Alunos com Restrições Alimentares</h2>
                <button
                  type="button"
                  onClick={adicionarRestricao}
                  className="text-sm text-[#4C6E5D] hover:text-[#6B7F66] flex items-center gap-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 0 1 1 1v3h3a1 1 0 1 1 0 2h-3v3a1 1 0 1 1-2 0v-3H6a1 1 0 1 1 0-2h3V6a1 1 0 0 1 1-1z" clipRule="evenodd" />
                  </svg>
                  Adicionar Restrição
                </button>
              </div>

              {form.alunosAtipicos.length === 0 ? (
                <p className="text-gray-500 text-sm p-4 bg-gray-50 rounded">Nenhuma restrição alimentar cadastrada.</p>
              ) : (
                <div className="space-y-3">
                  {form.alunosAtipicos.map((atipico, index) => (
                    <div key={index} className="flex gap-3 items-center p-3 bg-gray-50 rounded">
                      <select
                        className="flex-1 border border-gray-200 p-2 rounded bg-white"
                        value={atipico.restricaoId}
                        onChange={(e) =>
                          atualizarRestricao(index, 'restricaoId', e.target.value as RestricaoAlimentar)
                        }
                      >
                        {Object.entries(RestricaoAlimentarDescricao).map(([key, value]) => (
                          <option key={key} value={key}>
                            {value}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        className="w-24 border border-gray-200 p-2 rounded bg-white"
                        value={atipico.quantidade}
                        onChange={(e) =>
                          atualizarRestricao(index, 'quantidade', parseInt(e.target.value) || 0)
                        }
                        placeholder="Qtd"
                        min="0"
                      />
                      <button
                        type="button"
                        onClick={() => removerRestricao(index)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {erro && (
              <div className="text-red-700 bg-red-50 border border-red-200 p-4 rounded">
                {erro}
              </div>
            )}

            {sucesso && (
              <div className="text-green-700 bg-green-50 border border-green-200 p-4 rounded">
                Instituição cadastrada com sucesso! Redirecionando...
              </div>
            )}

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => router.push('/instituicoes')}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
              >
                Cancelar
              </button>
              
              <button
                type="submit"
                disabled={salvando}
                className={`px-6 py-2 rounded-md font-semibold transition ${
                  salvando
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-[#4C6E5D] text-white hover:bg-[#6B7F66]'
                }`}
              >
                {salvando ? 'Salvando...' : 'Salvar Instituição'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}