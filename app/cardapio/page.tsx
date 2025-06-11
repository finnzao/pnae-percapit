'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { converterListaParaMapaDeAlimentos, normalizarTexto } from '../api/utils/alimentosUtils';
import { AlimentoSelecionado, Refeicao } from '@/types/types';

export default function CriarCardapioPage() {
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
    <main className="bg-fundo text-texto min-h-screen py-12 px-4 font-sans">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">Criar Cardápio</h1>

        {refeicoes.map((refeicao, index) => (
          <div key={index} className="mb-6 p-6 border rounded-xl bg-cartao">
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
                className="mb-2 md:mb-0 border border-acento p-2 rounded bg-white w-full text-2xl font-bold"
              />
              <input
                type="time"
                value={refeicao.horario}
                onChange={e => {
                  const novas = [...refeicoes];
                  novas[index].horario = e.target.value;
                  setRefeicoes(novas);
                }}
                className="border border-acento p-2 rounded bg-white"
              />
            </div>

            <ul className="mt-4 space-y-2">
              {refeicao.alimentos.map((alimento, i) => (
                <li
                  key={i}
                  className="flex justify-between items-center bg-white p-2 rounded border cursor-pointer hover:bg-gray-100"
                  onClick={() => abrirModal(index, i)}
                >
                  <span className="text-base font-medium">{alimento.nome}</span>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      removerAlimento(index, i);
                    }}
                    className="text-red-600 text-xs hover:underline"
                  >
                    Remover
                  </button>
                </li>
              ))}
            </ul>

            <button
              onClick={() => abrirModal(index)}
              className="mt-4 text-sm text-acento hover:underline"
            >
              + Adicionar alimento
            </button>
          </div>
        ))}

        <button
          onClick={() => {
            setRefeicoes([...refeicoes, { nome: `Refeição ${refeicoes.length + 1}`, horario: '', alimentos: [] }]);
          }}
          className="text-sm text-acento hover:underline mb-6"
        >
          + Adicionar nova refeição
        </button>

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
                  className="border border-acento p-3 rounded bg-white w-full text-lg"
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
                      className="border border-acento p-3 rounded bg-white w-full text-lg"
                      inputMode="decimal"
                    />
                  </div>
                </div>
              )}
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setModalAberto({ index: null })}
                  className="px-6 py-3 bg-gray-300 rounded hover:bg-gray-400 text-lg"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarAlimento}
                  className="px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700 text-lg"
                  disabled={!alimentoSelecionado}
                >
                  Confirmar alimento
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
