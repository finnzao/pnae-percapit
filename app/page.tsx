'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { calcularPerCapita } from './api/calcularPerCapita';
import {
  normalizarTexto,
  converterListaParaMapaDeAlimentos,
  formatarPesoKg,
  calcularUnidadesNecessarias
} from './api/utils/alimentosUtils';
import AlertaRestricao, { Restricao } from '../components/AlertaRestricao';
import { UnidadeMedida, Etapa, ResultadoCalculo, Alimento, UnidadePeso } from '@/types';

export default function HomePage() {
  const router = useRouter();

  const [alimento, setAlimento] = useState<string>('');
  const [etapa, setEtapa] = useState<Etapa>('fundamental');
  const [alunos, setAlunos] = useState<string>('120');
  const [resultado, setResultado] = useState<ResultadoCalculo | null>(null);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);
  const [sugestoes, setSugestoes] = useState<string[]>([]);
  const [pesoPorPacote, setPesoPorPacote] = useState<string>('');
  const [unidadePacote, setUnidadePacote] = useState<UnidadeMedida>(UnidadePeso.G);

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
    <main className="bg-fundo text-texto min-h-screen py-12 px-4 font-sans">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Cálculo Per Capita - PNAE</h1>

        <div className="space-y-5 bg-cartao p-8 rounded-2xl shadow-lg border border-acento">
          <div className="relative flex flex-col space-y-1" ref={autocompleteRef}>
            <label htmlFor="alimento" className="text-sm font-medium text-texto">
              Nome do alimento
            </label>
            <input
              id="alimento"
              value={alimento}
              onChange={e => {
                setAlimento(e.target.value);
                setResultado(null);
              }}
              className="border border-acento p-2 rounded bg-white font-sans"
              placeholder="Ex: arroz tipo 1"
              autoComplete="off"
            />
            {sugestoes.length > 0 && (
              <ul className="absolute top-full z-10 mt-1 bg-white border border-gray-300 rounded shadow-md w-full">
                {sugestoes.map(sugestao => (
                  <li
                    key={sugestao}
                    onClick={() => {
                      setAlimento(sugestao);
                      setSugestoes([]);
                    }}
                    className="p-2 cursor-pointer hover:bg-gray-100"
                  >
                    {sugestao}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-col space-y-1">
            <label htmlFor="etapa" className="text-sm font-medium text-texto">
              Etapa de ensino
            </label>
            <select
              id="etapa"
              value={etapa}
              onChange={e => {
                setEtapa(e.target.value as Etapa);
                setResultado(null);
              }}
              className="border border-acento p-2 rounded bg-white font-sans"
            >
              <option value="creche">Creche</option>
              <option value="pre">Pré-escola</option>
              <option value="fundamental">Fundamental</option>
              <option value="medio">Ensino Médio</option>
            </select>
          </div>

          <div className="flex flex-col space-y-1">
            <label htmlFor="alunos" className="text-sm font-medium text-texto">
              Número de alunos
            </label>
            <input
              id="alunos"
              type="text"
              inputMode="numeric"
              value={alunos}
              onChange={handleAlunosChange}
              className="border border-acento p-2 rounded bg-white font-sans"
              placeholder="Ex: 100"
            />
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-sm font-medium text-texto">
              Peso por unidade do alimento (opcional)
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={pesoPorPacote}
                onChange={handlePesoChange}
                className="border border-acento p-2 rounded bg-white font-sans w-full"
                placeholder="Ex: 2,5"
                inputMode="decimal"
              />
              <select
                value={unidadePacote}
                onChange={e => setUnidadePacote(e.target.value as UnidadeMedida)}
                className="border border-acento p-2 rounded bg-white font-sans"
              >
                <option value="kg">kg</option>
                <option value="g">g</option>
              </select>
            </div>
          </div>

          {restricoes.length > 0 && <AlertaRestricao restricoes={restricoes} />}
          {mensagemErro && (
            <div className="text-red-700 bg-red-100 border border-red-400 p-3 rounded">
              {mensagemErro}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              onClick={calcular}
              disabled={!info || restricoes.some(r => r.tipo === 'erro' || r.mensagem.includes('Depende da preparação da receita'))}
              className={`font-semibold px-6 py-2 rounded-md transition font-sans ${!info || restricoes.some(r => r.tipo === 'erro' || r.mensagem.includes('Depende da preparação da receita')) ? 'bg-gray-400 cursor-not-allowed' : 'bg-botao text-black hover:opacity-90'}`}
            >
              Calcular
            </button>

            <button
              onClick={() => router.push('/cadastrarAlimento')}
              className="font-semibold px-6 py-2 rounded-md bg-acento text-black hover:opacity-90 transition font-sans"
            >
              Cadastrar alimento
            </button>

            <button
              onClick={() => router.push('/cardapio')}
              className="font-semibold px-6 py-2 rounded-md bg-acento text-black hover:opacity-90 transition font-sans"
            >
              Criar cardápio
            </button>

            <button
              onClick={() => router.push('/instituicoes')}
              className="font-semibold px-6 py-2 rounded-md bg-acento text-black hover:opacity-90 transition font-sans"
            >
              Instituições
            </button>
          </div>
        </div>

        {resultado && (
          <div className="mt-8 bg-cartao p-6 rounded-xl border border-acento shadow-md font-sans">
            <h2 className="font-semibold text-xl mb-4 text-center">Resultado</h2>
            <ul className="space-y-1 text-base">
              <li><strong>Alimento:</strong> {resultado.alimento}</li>
              <li><strong>Etapa:</strong> {resultado.etapa}</li>
              <li><strong>Alunos:</strong> {resultado.alunos}</li>
              <li><strong>Bruto por aluno:</strong> {formatarPesoKg(resultado.brutoPorAluno)}</li>
              {unidadesNecessarias !== null && (
                <li><strong>Unidades necessários:</strong> {unidadesNecessarias}</li>
              )}
              <li><strong>Total bruto:</strong> {formatarPesoKg(resultado.totalBruto)}</li>
              <li><strong>Total final (cozido):</strong> {formatarPesoKg(resultado.totalFinal)}</li>
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}