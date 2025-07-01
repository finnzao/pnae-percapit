'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { ArrowLeft, Calendar, Building2, AlertCircle, Save } from 'lucide-react';
import { Instituicao, Cardapio, CardapioDiario, Etapa } from '@/types';
import { calcularPerCapita } from '@/app/api/calcularPerCapita';
import { converterListaParaMapaDeAlimentos, normalizarTexto } from '@/app/api/utils/alimentosUtils';
import { usePreventDoubleClick } from '@/hooks/usePreventDoubleClick';

interface FormState {
    instituicaoId: string;
    dataInicio: string;
    dataFim: string;
    cardapiosDiarios: CardapioDiario[];
    observacoes: string;
}

interface AlimentoAgregado {
    alimentoId: string;
    alimentoNome: string;
    quantidadeTotal: number;
    unidadeMedida: string;
    detalhamentoRefeicoes: Array<{
        refeicaoId: string;
        refeicaoNome: string;
        quantidade: number;
    }>;
}

export default function CriarGuiaPage() {
    const router = useRouter();
    const [form, setForm] = useState<FormState>({
        instituicaoId: '',
        dataInicio: '',
        dataFim: '',
        cardapiosDiarios: [],
        observacoes: ''
    });

    const [instituicoes, setInstituicoes] = useState<Instituicao[]>([]);
    const [cardapios, setCardapios] = useState<Cardapio[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);

    const alimentosMapeados = useMemo(() => converterListaParaMapaDeAlimentos(), []);

    const { handleClick: handleSubmitClick, isLoading, cleanup } = usePreventDoubleClick(
        async () => {
            await salvarGuia();
        },
        {
            delay: 3000,
            onError: (error) => setErro(error.message),
            onSuccess: () => {
                router.push(`/guia-abastecimento`);
            }
        }
    );

    const gerarDiasNoIntervalo = useCallback(() => {
        const inicio = new Date(form.dataInicio);
        const fim = new Date(form.dataFim);

        if (inicio > fim) {
            setErro('Data inicial não pode ser maior que a data final');
            return;
        }

        const dias: CardapioDiario[] = [];
        const dataAtual = new Date(inicio);

        while (dataAtual <= fim) {
            dias.push({
                data: new Date(dataAtual),
                cardapioId: ''
            });
            dataAtual.setDate(dataAtual.getDate() + 1);
        }

        setForm(prev => ({ ...prev, cardapiosDiarios: dias }));
        setErro(null);
    }, [form.dataInicio, form.dataFim]);

    useEffect(() => {
        carregarDados();
        return () => {
            cleanup();
        };
    }, [cleanup]);

    useEffect(() => {
        if (form.dataInicio && form.dataFim) {
            gerarDiasNoIntervalo();
        }
    }, [form.dataInicio, form.dataFim, gerarDiasNoIntervalo]);

    const carregarDados = async () => {
        try {
            const [resInstituicoes, resCardapios] = await Promise.all([
                fetch('/api/salvar-instituicao'),
                fetch('/api/salvar-cardapio')
            ]);

            const dataInstituicoes = await resInstituicoes.json();
            const dataCardapios = await resCardapios.json();

            if (dataInstituicoes.ok) setInstituicoes(dataInstituicoes.data);
            if (dataCardapios.ok) setCardapios(dataCardapios.data);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            setErro('Erro ao carregar dados necessários');
        } finally {
            setCarregando(false);
        }
    };

    const atualizarCardapioDia = (index: number, cardapioId: string) => {
        const novosDias = [...form.cardapiosDiarios];
        novosDias[index].cardapioId = cardapioId;
        setForm(prev => ({ ...prev, cardapiosDiarios: novosDias }));
    };

    const getDiaSemana = (data: Date) => {
        const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        return dias[new Date(data).getDay()];
    };

    const calcularDistribuicao = (): AlimentoAgregado[] => {
        const instituicao = instituicoes.find(i => i.id === form.instituicaoId);
        if (!instituicao) return [];

        const alimentosAgregados: Record<string, AlimentoAgregado> = {};

        form.cardapiosDiarios.forEach(dia => {
            if (!dia.cardapioId) return;

            const cardapio = cardapios.find(c => c.id === dia.cardapioId);
            if (!cardapio) return;

            cardapio.refeicoes.forEach(refeicao => {
                refeicao.alimentos.forEach(alimento => {
                    const chaveAlimento = normalizarTexto(alimento.nome || '');

                    try {
                        const etapa: Etapa = 'fundamental';

                        const alimentosCompativel = Object.keys(alimentosMapeados).reduce((acc, chave) => {
                            const alimentoOriginal = alimentosMapeados[chave];
                            acc[chave] = {
                                ...alimentoOriginal,
                                id: chave,
                                _createdAt: new Date().toISOString()
                            };
                            return acc;
                        }, {} as Record<string, {
                            id: string;
                            nome: string;
                            fc: number;
                            fcc: number;
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            perCapita: any;
                            _createdAt: string;
                        }>);

                        const resultado = calcularPerCapita(
                            chaveAlimento,
                            etapa,
                            instituicao.totalAlunos,
                            alimentosCompativel
                        );

                        if (!alimentosAgregados[alimento.alimentoId]) {
                            alimentosAgregados[alimento.alimentoId] = {
                                alimentoId: alimento.alimentoId,
                                alimentoNome: alimento.nome || 'Alimento',
                                quantidadeTotal: 0,
                                unidadeMedida: 'kg',
                                detalhamentoRefeicoes: []
                            };
                        }

                        alimentosAgregados[alimento.alimentoId].quantidadeTotal += resultado.totalBruto / 1000;
                        alimentosAgregados[alimento.alimentoId].detalhamentoRefeicoes.push({
                            refeicaoId: refeicao.id,
                            refeicaoNome: refeicao.nome,
                            quantidade: resultado.totalBruto / 1000
                        });
                    } catch (error) {
                        console.error(`Erro ao calcular ${alimento.nome}:`, error);
                    }
                });
            });
        });

        return Object.values(alimentosAgregados);
    };

    const salvarGuia = async () => {
        setErro(null);

        if (!form.instituicaoId) {
            throw new Error('Selecione uma instituição');
        }

        const diasSemCardapio = form.cardapiosDiarios.filter(d => !d.cardapioId).length;
        if (diasSemCardapio > 0) {
            throw new Error(`${diasSemCardapio} dias estão sem cardápio definido`);
        }

        const instituicao = instituicoes.find(i => i.id === form.instituicaoId);
        const calculosDistribuicao = calcularDistribuicao();

        const guia = {
            instituicaoId: form.instituicaoId,
            instituicaoNome: instituicao?.nome,
            dataInicio: new Date(form.dataInicio),
            dataFim: new Date(form.dataFim),
            cardapiosDiarios: form.cardapiosDiarios.map(dia => ({
                ...dia,
                cardapioNome: cardapios.find(c => c.id === dia.cardapioId)?.nome
            })),
            calculosDistribuicao,
            observacoes: form.observacoes,
            usuarioGeracao: 'Ana Paula',
            status: 'Rascunho'
        };

        const response = await fetch('/api/guia-abastecimento', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(guia)
        });

        const data = await response.json();

        if (!response.ok) {
            if (response.status === 429) {
                throw new Error('Aguarde alguns segundos antes de tentar novamente.');
            }
            throw new Error(data.error || 'Erro ao salvar guia');
        }

        return data.data.id;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const guiaId = await handleSubmitClick();
        if (guiaId) {
            router.push(`/guia-abastecimento/${guiaId}`);
        }
    };

    if (carregando) {
        return (
            <div className="min-h-screen bg-[#FAFAF8]">
                <Header />
                <main className="page-container">
                    <div className="flex justify-center items-center h-64">
                        <p className="text-center text-gray-500">Carregando dados...</p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FAFAF8]">
            <Header />

            <main className="page-container">
                <button
                    onClick={() => router.push('/guia-abastecimento')}
                    className="flex items-center gap-2 text-[#4C6E5D] hover:text-[#6B7F66] mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Voltar às guias</span>
                </button>

                <div className="card-container">
                    <h1 className="text-2xl font-bold mb-6 text-center text-[#4C6E5D]">
                        Criar Nova Guia de Abastecimento
                    </h1>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Building2 className="w-4 h-4 inline mr-2" />
                                Instituição
                            </label>
                            <select
                                value={form.instituicaoId}
                                onChange={(e) => setForm(prev => ({ ...prev, instituicaoId: e.target.value }))}
                                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4C6E5D]"
                                required
                            >
                                <option value="">Selecione uma instituição</option>
                                {instituicoes.map(inst => (
                                    <option key={inst.id} value={inst.id}>
                                        {inst.nome} - {inst.totalAlunos} alunos
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Calendar className="w-4 h-4 inline mr-2" />
                                    Data Inicial
                                </label>
                                <input
                                    type="date"
                                    value={form.dataInicio}
                                    onChange={(e) => setForm(prev => ({ ...prev, dataInicio: e.target.value }))}
                                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4C6E5D]"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Calendar className="w-4 h-4 inline mr-2" />
                                    Data Final
                                </label>
                                <input
                                    type="date"
                                    value={form.dataFim}
                                    onChange={(e) => setForm(prev => ({ ...prev, dataFim: e.target.value }))}
                                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4C6E5D]"
                                    required
                                />
                            </div>
                        </div>

                        {form.cardapiosDiarios.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold text-[#4C6E5D] mb-4">
                                    Cardápios por Dia
                                </h3>
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {form.cardapiosDiarios.map((dia, index) => (
                                        <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                                            <div className="flex-1">
                                                <p className="font-medium">
                                                    {new Date(dia.data).toLocaleDateString('pt-BR')} - {getDiaSemana(dia.data)}
                                                </p>
                                            </div>
                                            <select
                                                value={dia.cardapioId}
                                                onChange={(e) => atualizarCardapioDia(index, e.target.value)}
                                                className="flex-1 p-2 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-[#4C6E5D]"
                                                required
                                            >
                                                <option value="">Selecione um cardápio</option>
                                                {cardapios.map(cardapio => (
                                                    <option key={cardapio.id} value={cardapio.id}>
                                                        {cardapio.nome}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Observações (opcional)
                            </label>
                            <textarea
                                value={form.observacoes}
                                onChange={(e) => setForm(prev => ({ ...prev, observacoes: e.target.value }))}
                                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4C6E5D] resize-none"
                                rows={3}
                                placeholder="Adicione observações sobre esta guia..."
                            />
                        </div>

                        {erro && (
                            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                <p>{erro}</p>
                            </div>
                        )}

                        <div className="flex justify-between pt-4">
                            <button
                                type="button"
                                onClick={() => router.push('/guia-abastecimento')}
                                disabled={isLoading}
                                className={`px-6 py-2 rounded-md transition ${isLoading
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                                    }`}
                            >
                                Cancelar
                            </button>

                            <button
                                type="submit"
                                disabled={isLoading || form.cardapiosDiarios.length === 0 || !form.instituicaoId}
                                className={`px-6 py-2 rounded-md font-semibold transition flex items-center gap-2 ${isLoading || form.cardapiosDiarios.length === 0 || !form.instituicaoId
                                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                    : 'bg-[#4C6E5D] text-white hover:bg-[#6B7F66]'
                                    }`}
                            >
                                <Save className="w-4 h-4" />
                                {isLoading ? 'Gerando...' : 'Gerar Guia'}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}