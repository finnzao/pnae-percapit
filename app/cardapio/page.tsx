'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { converterListaParaMapaDeAlimentos, normalizarTexto } from '../api/utils/alimentosUtils';
import { AlimentoSelecionado, Refeicao } from '@/types/types';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { ArrowLeft } from 'lucide-react';

export default function CriarCardapioPage() {
  const router = useRouter();
  const [refeicoes, setRefeicoes] = useState<Refeicao[]>([
    {
      nome: 'Refeição 1',
      horario: '',
      alimentos: []
    }
  ]);

  const [modalAberto, setModalAberto] = useState<{ index: number | null; alimentoIndex?: number }>({ index: null });
  const [alimentoBusca, setAlimentoBusca] = useState('');
  const [alimentoSelecionado, setAlimentoSelecionado] = useState<string | null>(null);
  const [pesoPorPacote, setPesoPorPacote] = useState<string>('');
  const [sugestoes, setSugestoes] = useState<string[]>([]);

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
      setModalAberto({ index: null });
    }
  };

  const removerAlimento = (refeicaoIndex: number, alimentoIndex: number) => {
    const novas = [...refeicoes];
    novas[refeicaoIndex].alimentos.splice(alimentoIndex, 1);
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

          {refeicoes.map((refeicao, index) => (
            <div key={index} className="mb-6 p-6 border rounded-xl bg-[#F5F5F3] shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center md:space-x-4">
                <input
                  type="text"
                  value={refeicao.nome}
                  onChange={e => {
                    const novas = [...refeicoes];
                    novas[index].nome = e.target.value;
                    setRefeicoes(novas);
                  }}
                  placeholder="Nome da refeição"
                  className="mb-2 md:mb-0 border border-gray-200 p-2 rounded bg-white w-full text-2xl font-bold"
                />
                <input
                  type="time"
                  value={refeicao.horario}
                  onChange={e => {
                    const novas = [...refeicoes];
                    novas[index].horario = e.target.value;
                    setRefeicoes(novas);
                  }}
                  className="border border-gray-200 p-2 rounded bg-white"
                />
              </div>

              <ul className="mt-4 space-y-2">
                {refeicao.alimentos.map((alimento, i) => (
                  <li
                    key={i}
                    className="flex justify-between items-center bg-white p-3 rounded border border-gray-100 cursor-pointer hover:bg-gray-50"
                    onClick={() => abrirModal(index, i)}
                  >
                    <span className="text-base font-medium">{alimento.nome}</span>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        removerAlimento(index, i);
                      }}
                      className="text-red-600 text-xs px-2 py-1 rounded hover:bg-red-50"
                    >
                      Remover
                    </button>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => abrirModal(index)}
                className="mt-4 text-sm text-primary hover:text-secondary flex items-center gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 0 1 1 1v3h3a1 1 0 1 1 0 2h-3v3a1 1 0 1 1-2 0v-3H6a1 1 0 1 1 0-2h3V6a1 1 0 0 1 1-1z" clipRule="evenodd" />
                </svg>
                Adicionar alimento
              </button>
            </div>
          ))}

          <div className="flex justify-between mb-6">
            <button
              onClick={() => {
                setRefeicoes([...refeicoes, { nome: `Refeição ${refeicoes.length + 1}`, horario: '', alimentos: [] }]);
              }}
              className="text-sm flex items-center gap-1 text-primary hover:text-secondary"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 0 1 1 1v3h3a1 1 0 1 1 0 2h-3v3a1 1 0 1 1-2 0v-3H6a1 1 0 1 1 0-2h3V6a1 1 0 0 1 1-1z" clipRule="evenodd" />
              </svg>
              Adicionar nova refeição
            </button>
            
            <button
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-secondary transition-colors"
            >
              Salvar Cardápio
            </button>
          </div>
        </div>

        {modalAberto.index !== null && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-2xl">
              <h2 className="text-2xl font-semibold mb-4">Selecionar Alimento</h2>
              <div ref={autocompleteRef} className="relative">
                <input
                  type="text"
                  value={alimentoBusca}
                  onChange={e => {
                    setAlimentoBusca(e.target.value);
                    setAlimentoSelecionado(null);
                  }}
                  placeholder="Digite o nome do alimento"
                  className="border border-gray-200 p-3 rounded bg-white w-full text-lg"
                />
                {sugestoes.length > 0 && (
                  <ul className="absolute top-full z-10 mt-1 bg-white border border-gray-300 rounded shadow-md w-full text-lg">
                    {sugestoes.map(sugestao => (
                      <li
                        key={sugestao}
                        onClick={() => {
                          setAlimentoBusca(sugestao);
                          setAlimentoSelecionado(sugestao);
                          setSugestoes([]);
                        }}
                        className="p-3 cursor-pointer hover:bg-gray-100"
                      >
                        {sugestao}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {alimentoSelecionado && (
                <div className="mt-6 p-4 border border-gray-300 rounded bg-gray-50 text-lg">
                  <p className="font-bold text-xl mb-2">{alimentoSelecionado}</p>
                  <p>FC: {alimentosMapeados[normalizarTexto(alimentoSelecionado)].fc}</p>
                  <p>FCC: {alimentosMapeados[normalizarTexto(alimentoSelecionado)].fcc}</p>
                  <p>Per capita (creche): {renderPerCapitaEtapa('creche')}</p>
                  <p>Per capita (pré): {renderPerCapitaEtapa('pre')}</p>
                  <p>Per capita (fundamental): {renderPerCapitaEtapa('fundamental')}</p>
                  <p>Per capita (médio): {renderPerCapitaEtapa('medio')}</p>
                  <div className="mt-4">
                    <label className="block mb-1 font-medium">Peso por pacote (opcional)</label>
                    <input
                      type="text"
                      value={pesoPorPacote}
                      onChange={handlePesoChange}
                      placeholder="Ex: 2,5"
                      className="border border-gray-200 p-3 rounded bg-white w-full text-lg"
                      inputMode="decimal"
                    />
                  </div>
                </div>
              )}
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setModalAberto({ index: null })}
                  className="px-6 py-3 bg-gray-200 rounded hover:bg-gray-300 text-lg"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarAlimento}
                  className="px-6 py-3 bg-primary text-white rounded hover:bg-secondary text-lg"
                  disabled={!alimentoSelecionado}
                >
                  Confirmar alimento
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}