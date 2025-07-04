'use client';
import { Alimento, Etapa, RestricaoAlimentar, RestricaoAlimentarDescricao } from '@/types';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { usePreventDoubleClick } from '@/hooks/usePreventDoubleClick';

const etapas: Etapa[] = ['creche', 'pre', 'fundamental', 'medio'];

type FormState = {
  nome: string;
  fc: string;
  fcc: string;
  limitada_menor3: boolean;
  limitada_todas: boolean;
  perCapita: Record<Etapa, string>;
  restricoesAlimentares: RestricaoAlimentar[];
};

export default function CadastrarAlimento() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    nome: '',
    fc: '1',
    fcc: '1',
    limitada_menor3: false,
    limitada_todas: false,
    perCapita: {
      creche: '',
      pre: '',
      fundamental: '',
      medio: '',
    },
    restricoesAlimentares: [],
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

  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  const regexNumero = /^\d*([.,]?\d*)?$/;

  // Hook para prevenir duplo clique
  const { handleClick: handleSubmitClick, isLoading, cleanup } = usePreventDoubleClick(
    async () => {
      return await salvarAlimento();
    },
    {
      delay: 2000,
      onError: (error) => setErro(error.message),
      onSuccess: () => {
        setTimeout(() => {
          router.push('/');
        }, 2000);
        setSucesso(true);
      }
    }
  );

  // Cleanup quando o componente for desmontado
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

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

  function alternarRestricao(restricao: RestricaoAlimentar) {
    setForm((prev) => {
      const restricoesAtuais = prev.restricoesAlimentares || [];
      if (restricoesAtuais.includes(restricao)) {
        return {
          ...prev,
          restricoesAlimentares: restricoesAtuais.filter(r => r !== restricao),
        };
      } else {
        return {
          ...prev,
          restricoesAlimentares: [...restricoesAtuais, restricao],
        };
      }
    });
  }

  async function salvarAlimento() {
    setErro(null);
    setSucesso(false);

    if (form.nome.trim() === '') {
      throw new Error('O campo Nome é obrigatório e não pode conter apenas espaços.');
    }

    if (form.fc.trim() === '') {
      throw new Error('O campo Fator de Correção (FC) é obrigatório.');
    }

    if (form.fcc.trim() === '') {
      throw new Error('O campo Fator de Cozimento (FCC) é obrigatório.');
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
      throw new Error('É obrigatório informar o per capita de pelo menos uma etapa.');
    }

    if (temErro) {
      setErrosPerCapita(novosErros);
      throw new Error('Corrija os campos de per capita antes de continuar.');
    }

    // Criar payload sem id e _createdAt (serão gerados no backend)
    const payload = {
      nome: form.nome.trim(),
      fc: Number(form.fc.replace(',', '.')),
      fcc: Number(form.fcc.replace(',', '.')),
      limitada_menor3: form.limitada_menor3,
      limitada_todas: form.limitada_todas,
      restricoesAlimentares: form.restricoesAlimentares,
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

    const resposta = await fetch('/api/alimentos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await resposta.json();

    if (!resposta.ok) {
      if (resposta.status === 429) {
        throw new Error('Aguarde alguns segundos antes de tentar novamente.');
      }
      throw new Error(data.error || 'Falha ao salvar.');
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleSubmitClick();
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <Header />

      <main className="page-container">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-[#4C6E5D] hover:text-[#6B7F66] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao início</span>
        </button>

        <div className="card-container">
          <h1 className="text-2xl font-bold mb-6 text-center text-[#4C6E5D]">Cadastrar Novo Alimento</h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex flex-col space-y-1">
              <label htmlFor="nome" className="text-sm font-medium">Nome</label>
              <input
                id="nome"
                className="border border-gray-200 p-2 rounded bg-white"
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
                  className="border border-gray-200 p-2 rounded bg-white"
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
                  className="border border-gray-200 p-2 rounded bg-white"
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
                    className="border border-gray-200 p-2 rounded bg-white"
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

            <fieldset className="space-y-3">
              <legend className="text-sm font-medium">Restrições Alimentares</legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.entries(RestricaoAlimentarDescricao).map(([key, value]) => (
                  <label key={key} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={form.restricoesAlimentares?.includes(key as RestricaoAlimentar) || false}
                      onChange={() => alternarRestricao(key as RestricaoAlimentar)}
                      className="accent-[#4C6E5D]"
                    />
                    <span className="text-sm">{value}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="inline-flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={!!form.limitada_menor3}
                  onChange={(e) => atualizarCampo('limitada_menor3', e.target.checked)}
                  className="accent-[#4C6E5D]"
                />
                <span>Restrita para menores de 3 anos</span>
              </label>

              <label className="inline-flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={!!form.limitada_todas}
                  onChange={(e) => atualizarCampo('limitada_todas', e.target.checked)}
                  className="accent-[#4C6E5D]"
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
                Alimento salvo com sucesso! Redirecionando...
              </div>
            )}

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => router.push('/')}
                disabled={isLoading}
                className={`px-6 py-2 rounded-md transition ${isLoading
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-300 text-black hover:bg-gray-400'
                  }`}
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className={`px-6 py-2 rounded-md font-semibold transition ${isLoading
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    : 'bg-[#4C6E5D] text-white hover:bg-[#6B7F66]'
                  }`}
              >
                {isLoading ? 'Salvando…' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}