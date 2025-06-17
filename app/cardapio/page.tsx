'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { converterListaParaMapaDeAlimentos, normalizarTexto } from '../api/utils/alimentosUtils';
import { AlimentoSelecionado, Refeicao } from '@/types/types';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { ArrowLeft, Plus, Clock, Trash2, Edit2, Check, X, Save, AlertCircle } from 'lucide-react';

export default function CriarCardapioPage() {
  const router = useRouter();
  const [nomeCardapio, setNomeCardapio] = useState('');
  const [descricaoCardapio, setDescricaoCardapio] = useState('');
  const [refeicoes, setRefeicoes] = useState<Refeicao[]>([
    {
      nome: 'Café da Manhã',
      horario: '07:00',
      alimentos: []
    }
  ]);

  const [modalAberto, setModalAberto] = useState<{ index: number | null; alimentoIndex?: number }>({ index: null });
  const [alimentoBusca, setAlimentoBusca] = useState('');
  const [alimentoSelecionado, setAlimentoSelecionado] = useState<string | null>(null);
  const [pesoPorPacote, setPesoPorPacote] = useState<string>('');
  const [sugestoes, setSugestoes] = useState<string[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  const autocompleteRef = useRef<HTMLDivElement>(null);

  const alimentosMapeados = useMemo(() => converterListaParaMapaDeAlimentos(), []);
  const nomesAlimentos = useMemo(
    () => Object.values(alimentosMapeados).map(a => a.nome),
    [alimentosMapeados]
  );

  useEffect(() => {
    function handleClickFora(event: MouseEvent) {
      if (
        autocompleteRef.current &&
        !autocompleteRef.current.contains(event.target as Node)
      ) {
        setSugestoes([]);
      }
    }
    document.addEventListener('mousedown', handleClickFora);
    return () => {
      document.removeEventListener('mousedown', handleClickFora);
    };
  }, []);

  useEffect(() => {
    const normalizadoAtual = normalizarTexto(alimentoBusca);
    if (!alimentoBusca) {
      setSugestoes([]);
      return;
    }
    const filtradas = nomesAlimentos.filter(nome => {
      const normalizado = normalizarTexto(nome);
      return (
        normalizado.includes(normalizadoAtual) &&
        normalizado !== normalizadoAtual
      );
    });
    setSugestoes(filtradas.slice(0, 5));
  }, [alimentoBusca, nomesAlimentos]);

  const abrirModal = (index: number, alimentoIndex?: number) => {
    setModalAberto({ index, alimentoIndex });
    if (alimentoIndex !== undefined) {
      const item = refeicoes[index].alimentos[alimentoIndex];
      setAlimentoBusca(item.nome);
      setAlimentoSelecionado(item.nome);
      setPesoPorPacote(item.pesoPacote?.toString() || '');
    } else {
      setAlimentoBusca('');
      setAlimentoSelecionado(null);
      setPesoPorPacote('');
    }
    setSugestoes([]);
  };

  const fecharModal = () => {
    setModalAberto({ index: null });
    setAlimentoBusca('');
    setAlimentoSelecionado(null);
    setPesoPorPacote('');
  };

  const handlePesoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    const regex = /^[0-9]{0,5}([.,]{0,1}[0-9]{0,2})?$/;
    if (regex.test(valor)) setPesoPorPacote(valor);
  };

  const confirmarAlimento = () => {
    if (modalAberto.index !== null && alimentoSelecionado) {
      const novas = [...refeicoes];
      const pesoNumerico = parseFloat(pesoPorPacote.replace(',', '.'));
      const novoAlimento: AlimentoSelecionado = {
        nome: alimentoSelecionado,
        pesoPacote: pesoPorPacote === '' || isNaN(pesoNumerico) ? null : pesoNumerico
      };

      if (modalAberto.alimentoIndex !== undefined) {
        novas[modalAberto.index].alimentos[modalAberto.alimentoIndex] = novoAlimento;
      } else {
        novas[modalAberto.index].alimentos.push(novoAlimento);
      }

      setRefeicoes(novas);
      fecharModal();
    }
  };

  const removerAlimento = (refeicaoIndex: number, alimentoIndex: number) => {
    const novas = [...refeicoes];
    novas[refeicaoIndex].alimentos.splice(alimentoIndex, 1);
    setRefeicoes(novas);
  };

  const removerRefeicao = (index: number) => {
    const novas = refeicoes.filter((_, i) => i !== index);
    setRefeicoes(novas);
  };

  const renderPerCapitaEtapa = (etapa: 'creche' | 'pre' | 'fundamental' | 'medio') => {
    if (!alimentoSelecionado) return 'N/A';
    const chave = normalizarTexto(alimentoSelecionado);
    const perCapitaInfo = alimentosMapeados[chave]?.perCapita?.[etapa];
    const unidade = alimentosMapeados[chave]?.unidade_medida || 'g';

    if (perCapitaInfo?.status === 'disponivel') {
      return `${perCapitaInfo.valor} ${unidade}`;
    }
    if (perCapitaInfo?.status === 'Depende da preparação da receita') {
      return `${perCapitaInfo.status}`;
    }
    else {
      return 'N/A';
    }
  };

  const validarCardapio = () => {
    if (!nomeCardapio.trim()) {
      setErro('Nome do cardápio é obrigatório');
      return false;
    }

    if (refeicoes.length === 0) {
      setErro('Adicione pelo menos uma refeição');
      return false;
    }

    const refeicoesVazias = refeicoes.filter(r => r.alimentos.length === 0);
    if (refeicoesVazias.length > 0) {
      setErro('Todas as refeições devem ter pelo menos um alimento');
      return false;
    }

    return true;
  };

  const salvarCardapio = async () => {
    setErro(null);
    setSucesso(false);

    if (!validarCardapio()) {
      return;
    }

    setSalvando(true);

    try {
      const cardapio = {
        nome: nomeCardapio.trim(),
        descricao: descricaoCardapio.trim(),
        refeicoes: refeicoes.map((r, index) => ({
          id: `ref-${index}`,
          nome: r.nome,
          horario: r.horario,
          alimentos: r.alimentos.map(a => ({
            nome: a.nome,
            alimentoId: normalizarTexto(a.nome),
            quantidade: a.pesoPacote || 0
          })),
          ordem: index
        }))
      };

      const response = await fetch('/api/salvar-cardapio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cardapio)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao salvar cardápio');
      }

      setSucesso(true);
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao salvar cardápio');
    } finally {
      setSalvando(false);
    }
  };

  const adicionarRefeicao = () => {
    const horarioBase = refeicoes.length > 0 
      ? refeicoes[refeicoes.length - 1].horario 
      : '12:00';
    
    const nomesRefeicoes = ['Lanche da Manhã', 'Almoço', 'Lanche da Tarde', 'Jantar'];
    const nomeRefeicao = nomesRefeicoes[refeicoes.length % nomesRefeicoes.length] || `Refeição ${refeicoes.length + 1}`;
    
    setRefeicoes([...refeicoes, { 
      nome: nomeRefeicao, 
      horario: horarioBase, 
      alimentos: [] 
    }]);
  };

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
        
        <div className="card-container">
          <h1 className="text-3xl font-bold mb-8 text-center text-[#4C6E5D]">Criar Cardápio</h1>

          {/* Informações do Cardápio */}
          <div className="mb-8 space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#4C4C4C] mb-2">
                Nome do Cardápio
              </label>
              <input
                type="text"
                value={nomeCardapio}
                onChange={(e) => setNomeCardapio(e.target.value)}
                placeholder="Ex: Cardápio Semanal - Janeiro"
                className="w-full border border-gray-200 p-3 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#4C6E5D] focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#4C4C4C] mb-2">
                Descrição (opcional)
              </label>
              <textarea
                value={descricaoCardapio}
                onChange={(e) => setDescricaoCardapio(e.target.value)}
                placeholder="Adicione observações sobre este cardápio..."
                className="w-full border border-gray-200 p-3 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#4C6E5D] focus:border-transparent resize-none"
                rows={3}
              />
            </div>
          </div>

          {/* Refeições */}
          <div className="space-y-4">
            {refeicoes.map((refeicao, index) => (
              <div key={index} className="p-6 border-2 border-gray-100 rounded-xl bg-white hover:border-[#C8D5B9] transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={refeicao.nome}
                      onChange={e => {
                        const novas = [...refeicoes];
                        novas[index].nome = e.target.value;
                        setRefeicoes(novas);
                      }}
                      placeholder="Nome da refeição"
                      className="text-xl font-semibold bg-transparent border-b-2 border-transparent hover:border-gray-200 focus:border-[#4C6E5D] focus:outline-none px-1 py-1 transition-colors"
                    />
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <input
                        type="time"
                        value={refeicao.horario}
                        onChange={e => {
                          const novas = [...refeicoes];
                          novas[index].horario = e.target.value;
                          setRefeicoes(novas);
                        }}
                        className="border border-gray-200 px-2 py-1 rounded bg-white text-sm"
                      />
                    </div>
                    
                    {refeicoes.length > 1 && (
                      <button
                        onClick={() => removerRefeicao(index)}
                        className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                        title="Remover refeição"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Lista de Alimentos */}
                <div className="space-y-2 mb-4">
                  {refeicao.alimentos.length === 0 ? (
                    <p className="text-gray-400 text-sm py-4 text-center">
                      Nenhum alimento adicionado
                    </p>
                  ) : (
                    refeicao.alimentos.map((alimento, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition-colors group"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <span className="font-medium">{alimento.nome}</span>
                          {alimento.pesoPacote && (
                            <span className="text-sm text-gray-500">
                              ({alimento.pesoPacote} kg/unidade)
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => abrirModal(index, i)}
                            className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => removerAlimento(index, i)}
                            className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                            title="Remover"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <button
                  onClick={() => abrirModal(index)}
                  className="w-full text-sm text-[#4C6E5D] hover:text-[#6B7F66] hover:bg-[#C8D5B9]/10 rounded-lg py-2 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar alimento
                </button>
              </div>
            ))}
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-between items-center mt-8">
            <button
              onClick={adicionarRefeicao}
              className="flex items-center gap-2 text-[#4C6E5D] hover:text-[#6B7F66] transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Adicionar nova refeição</span>
            </button>
            
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/')}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              
              <button
                onClick={salvarCardapio}
                disabled={salvando}
                className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  salvando 
                    ? 'bg-gray-400 cursor-not-allowed text-white' 
                    : 'bg-[#4C6E5D] hover:bg-[#6B7F66] text-white'
                }`}
              >
                <Save className="w-4 h-4" />
                {salvando ? 'Salvando...' : 'Salvar Cardápio'}
              </button>
            </div>
          </div>

          {/* Mensagens de Erro/Sucesso */}
          {erro && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700">{erro}</p>
            </div>
          )}
          
          {sucesso && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
              <Check className="w-5 h-5 text-green-600" />
              <p className="text-green-700">Cardápio salvo com sucesso! Redirecionando...</p>
            </div>
          )}
        </div>

        {/* Modal de Seleção de Alimento */}
        {modalAberto.index !== null && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto min-h-4/5">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-semibold text-[#4C6E5D]">
                  {modalAberto.alimentoIndex !== undefined ? 'Editar' : 'Adicionar'} Alimento
                </h2>
                <button
                  onClick={fecharModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div ref={autocompleteRef} className="relative mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buscar alimento
                </label>
                <input
                  type="text"
                  value={alimentoBusca}
                  onChange={e => {
                    setAlimentoBusca(e.target.value);
                    setAlimentoSelecionado(null);
                  }}
                  placeholder="Digite o nome do alimento"
                  className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4C6E5D] focus:border-transparent"
                />
                {sugestoes.length > 0 && (
                  <ul className="absolute top-full z-10 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg w-full max-h-60 overflow-y-auto">
                    {sugestoes.map(sugestao => (
                      <li
                        key={sugestao}
                        onClick={() => {
                          setAlimentoBusca(sugestao);
                          setAlimentoSelecionado(sugestao);
                          setSugestoes([]);
                        }}
                        className="p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        {sugestao}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {alimentoSelecionado && (
                <div className="bg-[#F5F5F3] border border-gray-200 rounded-lg p-6 space-y-4">
                  <h3 className="font-bold text-lg text-[#4C6E5D] mb-3">{alimentoSelecionado}</h3>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Fator de Correção (FC):</span>
                      <span className="ml-2">{alimentosMapeados[normalizarTexto(alimentoSelecionado)]?.fc}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Fator de Cocção (FCC):</span>
                      <span className="ml-2">{alimentosMapeados[normalizarTexto(alimentoSelecionado)]?.fcc}</span>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-700 mb-2">Per capita por etapa:</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Creche:</span>
                        <span className="font-medium">{renderPerCapitaEtapa('creche')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Pré-escola:</span>
                        <span className="font-medium">{renderPerCapitaEtapa('pre')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Fundamental:</span>
                        <span className="font-medium">{renderPerCapitaEtapa('fundamental')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Médio:</span>
                        <span className="font-medium">{renderPerCapitaEtapa('medio')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Peso por pacote/unidade (opcional)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={pesoPorPacote}
                        onChange={handlePesoChange}
                        placeholder="Ex: 2,5"
                        className="flex-1 border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4C6E5D] focus:border-transparent"
                        inputMode="decimal"
                      />
                      <span className="text-gray-600 font-medium">kg</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-8 flex justify-end gap-3">
                <button
                  onClick={fecharModal}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarAlimento}
                  disabled={!alimentoSelecionado}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                    alimentoSelecionado
                      ? 'bg-[#4C6E5D] hover:bg-[#6B7F66] text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}