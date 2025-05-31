'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { calcularPerCapita } from '../api/calcularPerCapita';
import type { Etapa, ResultadoCalculo } from '../api/types';
import {
  normalizarTexto,
  converterListaParaMapaDeAlimentos,
  formatarPesoKg
} from '../api/utils/alimentosUtils';
import AlertaRestricao, { Restricao } from '../components/AlertaRestricao';

export default function HomePage() {
  const [alimento, setAlimento] = useState('');
  const [etapa, setEtapa] = useState<Etapa>('fundamental');
  const [alunos, setAlunos] = useState(120);
  const [resultado, setResultado] = useState<ResultadoCalculo | null>(null);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);
  const [sugestoes, setSugestoes] = useState<string[]>([]);

  const autocompleteRef = useRef<HTMLDivElement>(null);

  const alimentosMapeados = useMemo(() => converterListaParaMapaDeAlimentos(), []);
  const nomesAlimentos = useMemo(
    () => Object.values(alimentosMapeados).map(a => a.nome),
    [alimentosMapeados]
  );

  const chave = normalizarTexto(alimento);
  const info = alimentosMapeados[chave];

  const restricoes: Restricao[] = [];

  if (alimento && !info) {
    restricoes.push({
      tipo: 'erro',
      mensagem: 'Alimento não encontrado.'
    });
  }

  if (info?.limitada_menor3 && etapa === 'creche') {
    restricoes.push({
      tipo: 'erro',
      mensagem: 'O alimento não pode ser utilizado para a etapa "creche" devido à restrição nutricional.'
    });
  }

  if (info?.limitada_todas) {
    restricoes.push({
      tipo: 'aviso',
      mensagem: 'Oferta limitada para todas as idades.'
    });
  }

  // Verifica se há "*" no valor da etapa selecionada
  const valorEtapa = info?.perCapita?.[etapa];
  const valorComAsterisco = valorEtapa === '*';

  if (valorComAsterisco) {
    restricoes.push({
      tipo: 'aviso',
      mensagem: 'Depende da preparação da receita.'
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
      return (
        normalizado.includes(normalizadoAtual) &&
        normalizado !== normalizadoAtual
      );
    });

    setSugestoes(filtradas.slice(0, 5));
  }, [alimento, nomesAlimentos]);

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

  const calcular = () => {
    try {
      setMensagemErro(null);
      const res = calcularPerCapita(chave, etapa, alunos, alimentosMapeados);
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
          {/* Campo de Autocomplete para Alimento */}
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
                {sugestoes.map((sugestao) => (
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

          {/* Campo Etapa */}
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

          {/* Campo Alunos */}
          <div className="flex flex-col space-y-1">
            <label htmlFor="alunos" className="text-sm font-medium text-texto">
              Número de alunos
            </label>
            <input
              id="alunos"
              type="number"
              value={alunos}
              onChange={e => setAlunos(Number(e.target.value))}
              className="border border-acento p-2 rounded bg-white font-sans"
              placeholder="Ex: 100"
            />
          </div>

          {/* Alerta de Restrições */}
          {restricoes.length > 0 && <AlertaRestricao restricoes={restricoes} />}
          {mensagemErro && (
            <div className="text-red-700 bg-red-100 border border-red-400 p-3 rounded">
              {mensagemErro}
            </div>
          )}

          {/* Botão Calcular */}
          <button
            onClick={calcular}
            disabled={
              !info ||
              restricoes.some(r =>
                r.tipo === 'erro' || r.mensagem.includes('Depende da preparação da receita')
              )
            }
            className={`font-semibold px-6 py-2 rounded-md transition font-sans ${
              !info ||
              restricoes.some(r =>
                r.tipo === 'erro' || r.mensagem.includes('Depende da preparação da receita')
              )
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-botao text-black hover:opacity-90'
            }`}
          >
            Calcular
          </button>
        </div>

        {/* Resultado */}
        {resultado && (
          <div className="mt-8 bg-cartao p-6 rounded-xl border border-acento shadow-md font-sans">
            <h2 className="font-semibold text-xl mb-4 text-center">Resultado</h2>
            <ul className="space-y-1 text-base">
              <li><strong>Alimento:</strong> {resultado.alimento}</li>
              <li><strong>Etapa:</strong> {resultado.etapa}</li>
              <li><strong>Alunos:</strong> {resultado.alunos}</li>
              <li><strong>Bruto por aluno:</strong> {formatarPesoKg(resultado.brutoPorAluno)}</li>
              <li><strong>Total bruto:</strong> {formatarPesoKg(resultado.totalBruto)}</li>
              <li><strong>Total final (cozido):</strong> {formatarPesoKg(resultado.totalFinal)}</li>
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}
