'use client';
import { Alimento, Etapa } from '@/types';
import { useState } from 'react';

const etapas: Etapa[] = ['creche', 'pre', 'fundamental', 'medio'];

type FormState = Omit<Alimento, 'fc' | 'fcc' | 'perCapita' | 'unidade_medida'> & {
  fc: string;
  fcc: string;
  perCapita: Record<Etapa, string>;
};

export default function CadastrarAlimento() {
  const [form, setForm] = useState<FormState>({
    nome: '',
    fc: '1',
    fcc: '1',
    limitada_todas: false,
    perCapita: {
      creche: '',
      pre: '',
      fundamental: '',
      medio: '',
    },

  });

  const [perCapitaIndisponivel, setPerCapitaIndisponivel] = useState<Record<Etapa, boolean>>({
    creche: false,
    pre: false,
    fundamental: false,
    medio: false,
  });

  const [errosPerCapita, setErrosPerCapita] = useState<Record<Etapa, string | null>>({
    creche: null,
    pre: null,
    fundamental: null,
    medio: null,
  });

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  const regexNumero = /^\d*([.,]?\d*)?$/;

  function atualizarCampo<K extends keyof FormState>(campo: K, valor: FormState[K]) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  function handleNumeroChange(campo: 'fc' | 'fcc', valor: string) {
    if (valor === '' || regexNumero.test(valor)) {
      atualizarCampo(campo, valor);
    }
  }

  function atualizarPerCapita(etapa: Etapa, valor: string) {
    if (valor === '' || regexNumero.test(valor)) {
      setForm((prev) => ({
        ...prev,
        perCapita: {
          ...prev.perCapita,
          [etapa]: valor,
        },
      }));
      setErrosPerCapita((prev) => ({ ...prev, [etapa]: null }));
    } else {
      setErrosPerCapita((prev) => ({
        ...prev,
        [etapa]: 'Valor inválido. Use apenas números, ponto ou vírgula.',
      }));
    }
  }

  function alternarIndisponivel(etapa: Etapa) {
    const novoEstado = !perCapitaIndisponivel[etapa];
    setPerCapitaIndisponivel((prev) => ({ ...prev, [etapa]: novoEstado }));

    if (novoEstado) {
      setForm((prev) => ({
        ...prev,
        perCapita: { ...prev.perCapita, [etapa]: '' },
      }));
      setErrosPerCapita((prev) => ({ ...prev, [etapa]: null }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setSucesso(false);
    setSalvando(true);

    if (form.nome.trim() === '') {
      setErro('O campo Nome é obrigatório e não pode conter apenas espaços.');
      setSalvando(false);
      return;
    }

    if (form.fc.trim() === '') {
      setErro('O campo Fator de Correção (FC) é obrigatório.');
      setSalvando(false);
      return;
    }

    if (form.fcc.trim() === '') {
      setErro('O campo Fator de Cozimento (FCC) é obrigatório.');
      setSalvando(false);
      return;
    }

    let temErro = false;
    const novosErros: Record<Etapa, string | null> = { ...errosPerCapita };

    for (const et of etapas) {
      const valor = form.perCapita[et];
      if (!perCapitaIndisponivel[et]) {
        if (valor.trim() === '') {
          novosErros[et] = 'Este campo é obrigatório para essa etapa.';
          temErro = true;
        } else if (!regexNumero.test(valor)) {
          novosErros[et] = 'Valor inválido. Use apenas números, ponto ou vírgula.';
          temErro = true;
        }
      }
    }

    const peloMenosUmPreenchido = etapas.some(
      (et) => !perCapitaIndisponivel[et] && form.perCapita[et].trim() !== ''
    );

    if (!peloMenosUmPreenchido) {
      setErro('É obrigatório informar o per capita de pelo menos uma etapa.');
      setSalvando(false);
      return;
    }

    if (temErro) {
      setErrosPerCapita(novosErros);
      setErro('Corrija os campos de per capita antes de continuar.');
      setSalvando(false);
      return;
    }

    try {
      const payload: Alimento = {
        nome: form.nome.trim(),
        fc: Number(form.fc.replace(',', '.')),
        fcc: Number(form.fcc.replace(',', '.')),
        limitada_menor3: form.limitada_menor3,
        limitada_todas: form.limitada_todas,
        perCapita: Object.fromEntries(
          etapas.map((et) => {
            if (perCapitaIndisponivel[et]) {
              return [et, { status: 'indisponivel' }];
            }
            return [
              et,
              {
                status: 'disponivel',
                valor: Number(form.perCapita[et].replace(',', '.')),
              },
            ];
          })
        ) as Alimento['perCapita'],
      };

      const resposta = await fetch('/api/salvar-alimento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!resposta.ok) {
        throw new Error(
          `Erro ${resposta.status}: ${(await resposta.text()) || 'Falha ao salvar.'}`
        );
      }

      setSucesso(true);
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setSalvando(false);
    }
  }




  return (
    <main className="bg-fundo text-texto min-h-screen py-12 px-4 font-sans">
      <div className="max-w-3xl mx-auto bg-cartao p-8 rounded-2xl shadow-lg border border-acento">
        <h1 className="text-2xl font-bold mb-6 text-center">Cadastrar novo alimento</h1>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex flex-col space-y-1">
            <label htmlFor="nome" className="text-sm font-medium">Nome</label>
            <input
              id="nome"
              className="border border-acento p-2 rounded bg-white"
              value={form.nome}
              onChange={(e) => atualizarCampo('nome', e.target.value)}
              required
              placeholder="Ex: Arroz tipo 1"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1">
              <label htmlFor="fc" className="text-sm font-medium">Fator de Correção (FC)</label>
              <input
                id="fc"
                type="text"
                className="border border-acento p-2 rounded bg-white"
                value={form.fc}
                onChange={(e) => handleNumeroChange('fc', e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col space-y-1">
              <label htmlFor="fcc" className="text-sm font-medium">Fator de Cozimento (FCC)</label>
              <input
                id="fcc"
                type="text"
                className="border border-acento p-2 rounded bg-white"
                value={form.fcc}
                onChange={(e) => handleNumeroChange('fcc', e.target.value)}
                required
              />
            </div>
          </div>

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium">Per Capita (g)</legend>
            {etapas.map((et) => (
              <div key={et} className="grid grid-cols-[120px_1fr_auto] gap-3 items-center">
                <label className="capitalize">{et}</label>
                <input
                  type="text"
                  className="border border-acento p-2 rounded bg-white"
                  value={form.perCapita[et]}
                  onChange={(e) => atualizarPerCapita(et, e.target.value)}
                  disabled={perCapitaIndisponivel[et]}
                  placeholder='Ex: "35"'
                />
                <label className="flex items-center space-x-1 text-gray-600 text-xs">
                  <input
                    type="checkbox"
                    checked={perCapitaIndisponivel[et]}
                    onChange={() => alternarIndisponivel(et)}
                  />
                  <span>Indisponível para essa etapa</span>
                </label>
                {errosPerCapita[et] && (
                  <div className="col-span-2 text-red-600 text-xs">
                    {errosPerCapita[et]}
                  </div>
                )}
              </div>
            ))}
          </fieldset>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="inline-flex items-center space-x-2">
              <input
                type="checkbox"
                checked={!!form.limitada_menor3}
                onChange={(e) => atualizarCampo('limitada_menor3', e.target.checked)}
                className="accent-botao"
              />
              <span>Restrita para menores de 3 anos</span>
            </label>

            <label className="inline-flex items-center space-x-2">
              <input
                type="checkbox"
                checked={!!form.limitada_todas}
                onChange={(e) => atualizarCampo('limitada_todas', e.target.checked)}
                className="accent-botao"
              />
              <span>Oferta limitada para todas as idades</span>
            </label>
          </div>

          {erro && (
            <div className="text-red-700 bg-red-100 border border-red-400 p-3 rounded">
              {erro}
            </div>
          )}
          {sucesso && (
            <div className="text-green-700 bg-green-100 border border-green-400 p-3 rounded">
              Alimento salvo com sucesso!
            </div>
          )}

          <button
            type="submit"
            disabled={salvando}
            className={`w-full sm:w-auto px-6 py-2 rounded-md font-semibold transition ${salvando
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-botao text-black hover:opacity-90'
              }`}
          >
            {salvando ? 'Salvando…' : 'Salvar'}
          </button>
        </form>
      </div>
    </main>
  );
}
