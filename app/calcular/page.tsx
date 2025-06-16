'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { calcularPerCapita } from '../api/calcularPerCapita';
import {
  normalizarTexto,
  converterListaParaMapaDeAlimentos,
  formatarPesoKg,
  calcularUnidadesNecessarias
} from '../api/utils/alimentosUtils';
import AlertaRestricao, { Restricao } from '@/components/AlertaRestricao';
import Header from '@/components/Header';
import { UnidadeMedida, Etapa, ResultadoCalculo, Alimento, UnidadePeso } from '@/types';
import { ArrowLeft } from 'lucide-react';

export default function CalcularPage() {
  const router = useRouter();
  const [alimento, setAlimento] = useState<string>('');
  const [etapa, setEtapa] = useState<Etapa>('fundamental');
  const [alunos, setAlunos] = useState<string>('120');
  const [resultado, setResultado] = useState<ResultadoCalculo | null>(null);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);
  const [sugestoes, setSugestoes] = useState<string[]>([]);
  const [pesoPorPacote, setPesoPorPacote] = useState<string>('');
  const [unidadePacote, setUnidadePacote] = useState<UnidadeMedida>(UnidadePeso.KG);

  const autocompleteRef = useRef<HTMLDivElement>(null);

  const alimentosMapeados: Record<string, Alimento> = useMemo(() => converterListaParaMapaDeAlimentos(), []);
  const nomesAlimentos: string[] = useMemo(
    () => Object.values(alimentosMapeados).map(a => a.nome),
    [alimentosMapeados]
  );

  const chave: string = normalizarTexto(alimento);
  const info: Alimento | undefined = alimentosMapeados[chave];

  const unidadesNecessarias = useMemo(() => {
    const valor = pesoPorPacote.replace(',', '.');
    const pesoNumerico = parseFloat(valor);
    return calcularUnidadesNecessarias(
      resultado,
      isNaN(pesoNumerico) ? '' : pesoNumerico,
      unidadePacote,
      info?.unidade_medida || UnidadePeso.G
    );
  }, [resultado, pesoPorPacote, unidadePacote, info?.unidade_medida]);

  const restricoes: Restricao[] = [];
  if (alimento && !info) {
    restricoes.push({ tipo: 'erro', mensagem: 'Alimento não encontrado.' });
  }
  if (info?.limitada_menor3 && etapa === 'creche') {
    restricoes.push({
      tipo: 'erro',
      mensagem: 'O alimento não pode ser utilizado para a etapa "creche" devido à restrição nutricional.'
    });
  }
  if (info?.limitada_todas) {
    restricoes.push({ tipo: 'aviso', mensagem: 'Oferta limitada para todas as idades.' });
  }

  const valorEtapa = info?.perCapita?.[etapa];
  if (valorEtapa?.status === 'indisponivel') {
    restricoes.push({
      tipo: 'erro',
      mensagem: `O alimento não pode ser utilizado para a etapa "${etapa}" porque está indisponível.`
    });
  }

  useEffect(() => {
    const normalizadoAtual = normalizarTexto(alimento);
    if (!alimento) {
      setSugestoes([]);
      return;
    }
    const filtradas = nomesAlimentos.filter(nome => {
      const normalizado = normalizarTexto(nome);
      return normalizado.includes(normalizadoAtual) && normalizado !== normalizadoAtual;
    });
    setSugestoes(filtradas.slice(0, 5));
  }, [alimento, nomesAlimentos]);

  useEffect(() => {
    function handleClickFora(event: MouseEvent) {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
        setSugestoes([]);
      }
    }
    document.addEventListener('mousedown', handleClickFora);
    return () => {
      document.removeEventListener('mousedown', handleClickFora);
    };
  }, []);

  const handlePesoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    const regex = /^[0-9]{0,5}([.,]{0,1}[0-9]{0,2})?$/;
    if (regex.test(valor)) setPesoPorPacote(valor);
  };

  const handleAlunosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    const regex = /^[0-9]{0,4}$/;
    if (regex.test(valor)) setAlunos(valor);
  };

  const calcular = (): void => {
    try {
      setMensagemErro(null);
      const alunosNum = parseInt(alunos);
      if (isNaN(alunosNum) || alunosNum <= 0) throw new Error('Número de alunos inválido.');
      const res = calcularPerCapita(chave, etapa, alunosNum, alimentosMapeados);
      setResultado(res);
    } catch (e) {
      setMensagemErro((e as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <Header />
      
      <main className="container-custom py-8">
        {/* Navegação */}
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-[#4C6E5D] hover:text-[#6B7F66] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao início</span>
        </button>

        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-semibold text-[#4C6E5D] mb-8 text-center">
            Calculadora Per Capita
          </h1>

          <div className="bg-white rounded-xl card-shadow p-8">
            <form className="space-y-6">
              {/* Campo de Alimento */}
              <div className="relative" ref={autocompleteRef}>
                <label htmlFor="alimento" className="block text-sm font-medium text-[#4C4C4C] mb-2">
                  Nome do alimento
                </label>
                <input
                  id="alimento"
                  value={alimento}
                  onChange={e => {
                    setAlimento(e.target.value);
                    setResultado(null);
                  }}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4C6E5D] focus:border-transparent"
                  placeholder="Ex: Arroz tipo 1"
                  autoComplete="off"
                />
                {sugestoes.length > 0 && (
                  <ul className="absolute top-full z-10 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg w-full">
                    {sugestoes.map(sugestao => (
                      <li
                        key={sugestao}
                        onClick={() => {
                          setAlimento(sugestao);
                          setSugestoes([]);
                        }}
                        className="px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        {sugestao}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Grid de Etapa e Alunos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="etapa" className="block text-sm font-medium text-[#4C4C4C] mb-2">
                    Etapa de ensino
                  </label>
                  <select
                    id="etapa"
                    value={etapa}
                    onChange={e => {
                      setEtapa(e.target.value as Etapa);
                      setResultado(null);
                    }}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4C6E5D] focus:border-transparent"
                  >
                    <option value="creche">Creche</option>
                    <option value="pre">Pré-escola</option>
                    <option value="fundamental">Ensino Fundamental</option>
                    <option value="medio">Ensino Médio</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="alunos" className="block text-sm font-medium text-[#4C4C4C] mb-2">
                    Número de alunos
                  </label>
                  <input
                    id="alunos"
                    type="text"
                    inputMode="numeric"
                    value={alunos}
                    onChange={handleAlunosChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4C6E5D] focus:border-transparent"
                    placeholder="Ex: 100"
                  />
                </div>
              </div>

              {/* Campo de Peso por Pacote */}
              <div>
                <label className="block text-sm font-medium text-[#4C4C4C] mb-2">
                  Peso por unidade do alimento (opcional)
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={pesoPorPacote}
                    onChange={handlePesoChange}
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4C6E5D] focus:border-transparent"
                    placeholder="Ex: 2,5"
                    inputMode="decimal"
                  />
                  <select
                    value={unidadePacote}
                    onChange={e => setUnidadePacote(e.target.value as UnidadeMedida)}
                    className="px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4C6E5D] focus:border-transparent"
                  >
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                  </select>
                </div>
              </div>

              {/* Alertas e Erros */}
              {restricoes.length > 0 && <AlertaRestricao restricoes={restricoes} />}
              {mensagemErro && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {mensagemErro}
                </div>
              )}

              {/* Botão de Calcular */}
              <button
                type="button"
                onClick={calcular}
                disabled={!info || restricoes.some(r => r.tipo === 'erro')}
                className={`w-full py-3 rounded-lg font-medium transition-all ${
                  !info || restricoes.some(r => r.tipo === 'erro')
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'btn-primary'
                }`}
              >
                Calcular Quantidade
              </button>
            </form>
          </div>

          {/* Resultado */}
          {resultado && (
            <div className="mt-6 bg-white rounded-xl card-shadow p-8">
              <h2 className="text-lg font-semibold text-[#4C6E5D] mb-4">
                Resultado do Cálculo
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-[#4C4C4C]">Alimento:</span>
                  <span className="font-medium">{resultado.alimento}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-[#4C4C4C]">Etapa:</span>
                  <span className="font-medium capitalize">{resultado.etapa}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-[#4C4C4C]">Número de alunos:</span>
                  <span className="font-medium">{resultado.alunos}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-[#4C4C4C]">Quantidade bruta por aluno:</span>
                  <span className="font-medium">{formatarPesoKg(resultado.brutoPorAluno)}</span>
                </div>
                {unidadesNecessarias !== null && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-[#4C4C4C]">Unidades necessárias:</span>
                    <span className="font-medium">{unidadesNecessarias} pacotes</span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-[#4C4C4C]">Total bruto necessário:</span>
                  <span className="font-medium text-[#4C6E5D]">{formatarPesoKg(resultado.totalBruto)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-[#4C4C4C]">Total após cocção:</span>
                  <span className="font-medium text-[#4C6E5D]">{formatarPesoKg(resultado.totalFinal)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}