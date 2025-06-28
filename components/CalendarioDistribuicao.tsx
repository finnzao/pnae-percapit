'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import {
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    Calendar,
    CheckCircle,
    X,
    Building2,
    FileText
} from 'lucide-react';
import { GuiaAbastecimento } from '@/types';

interface DiaCalendario {
    dia: number;
    mesAtual: boolean;
    guias: GuiaAbastecimento[];
    temDistribuicao: boolean;
}

interface DetalheDia {
    data: Date;
    guias: GuiaAbastecimento[];
}

export default function CalendarioDistribuicao() {
    const router = useRouter();
    const [guias, setGuias] = useState<GuiaAbastecimento[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [mesAtual, setMesAtual] = useState(new Date());
    const [diasCalendario, setDiasCalendario] = useState<DiaCalendario[]>([]);
    const [diaSelecionado, setDiaSelecionado] = useState<DetalheDia | null>(null);
    const [modalAberto, setModalAberto] = useState(false);

    const [estatisticasMes, setEstatisticasMes] = useState({
        totalGuias: 0,
        guiasDistribuidas: 0,
        diasComDistribuicao: 0,
        instituicoesAtendidas: 0
    });

    const carregarGuias = async () => {
        try {
            const response = await fetch('/api/guia-abastecimento');
            const data = await response.json();
            if (data.ok) {
                setGuias(data.data);
            }
        } catch (error) {
            console.error('Erro ao carregar guias:', error);
        } finally {
            setCarregando(false);
        }
    };

    const gerarCalendario = useCallback(() => {
        const ano = mesAtual.getFullYear();
        const mes = mesAtual.getMonth();
        const primeiroDia = new Date(ano, mes, 1);
        const ultimoDia = new Date(ano, mes + 1, 0);
        const primeiroDiaSemana = primeiroDia.getDay();

        const dias: DiaCalendario[] = [];

        for (let i = primeiroDiaSemana - 1; i >= 0; i--) {
            const data = new Date(ano, mes, -i);
            dias.push({
                dia: data.getDate(),
                mesAtual: false,
                guias: [],
                temDistribuicao: false
            });
        }

        for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
            const dataAtual = new Date(ano, mes, dia);
            const guiasDoDia = guias.filter(guia => {
                const inicio = new Date(guia.dataInicio);
                const fim = new Date(guia.dataFim);
                return dataAtual >= inicio && dataAtual <= fim;
            });

            const guiasDistribuidasDia = guias.filter(guia => {
                if (guia.status !== 'Distribuído') return false;
                const dataGeracao = new Date(guia.dataGeracao);
                return dataGeracao.toDateString() === dataAtual.toDateString();
            });

            const temDistribuicao = guiasDistribuidasDia.length > 0;

            dias.push({
                dia,
                mesAtual: true,
                guias: guiasDoDia,
                temDistribuicao
            });
        }

        const diasRestantes = 42 - dias.length;
        for (let dia = 1; dia <= diasRestantes; dia++) {
            dias.push({
                dia,
                mesAtual: false,
                guias: [],
                temDistribuicao: false
            });
        }

        setDiasCalendario(dias);
    }, [mesAtual, guias]);

    const calcularEstatisticas = useCallback(() => {
        const ano = mesAtual.getFullYear();
        const mes = mesAtual.getMonth();
        const primeiroDiaMes = new Date(ano, mes, 1);
        const ultimoDiaMes = new Date(ano, mes + 1, 0);

        const guiasDoMes = guias.filter(guia => {
            const inicio = new Date(guia.dataInicio);
            const fim = new Date(guia.dataFim);
            return inicio <= ultimoDiaMes && fim >= primeiroDiaMes;
        });

        const guiasDistribuidas = guias.filter(guia => {
            if (guia.status !== 'Distribuído') return false;
            const dataGeracao = new Date(guia.dataGeracao);
            return dataGeracao >= primeiroDiaMes && dataGeracao <= ultimoDiaMes;
        });

        const diasComDistribuicao = new Set();
        guiasDistribuidas.forEach(guia => {
            const dataGeracao = new Date(guia.dataGeracao);
            diasComDistribuicao.add(dataGeracao.toDateString());
        });

        const instituicoesAtendidas = new Set();
        guiasDistribuidas.forEach(guia => {
            if (guia.instituicaoId) {
                instituicoesAtendidas.add(guia.instituicaoId);
            }
        });

        setEstatisticasMes({
            totalGuias: guiasDoMes.length,
            guiasDistribuidas: guiasDistribuidas.length,
            diasComDistribuicao: diasComDistribuicao.size,
            instituicoesAtendidas: instituicoesAtendidas.size
        });
    }, [mesAtual, guias]);

    useEffect(() => {
        carregarGuias();
    }, []);

    useEffect(() => {
        gerarCalendario();
        calcularEstatisticas();
    }, [mesAtual, guias, gerarCalendario, calcularEstatisticas]);

    const navegarMes = (direcao: 'anterior' | 'proximo') => {
        const novoMes = new Date(mesAtual);
        if (direcao === 'anterior') {
            novoMes.setMonth(novoMes.getMonth() - 1);
        } else {
            novoMes.setMonth(novoMes.getMonth() + 1);
        }
        setMesAtual(novoMes);
    };

    const selecionarDia = (dia: DiaCalendario) => {
        if (!dia.mesAtual) return;

        const data = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), dia.dia);
        setDiaSelecionado({
            data,
            guias: dia.guias
        });
        setModalAberto(true);
    };

    const formatarData = (data: Date) => {
        return data.toLocaleDateString('pt-BR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatarMesAno = (data: Date) => {
        return data.toLocaleDateString('pt-BR', {
            month: 'long',
            year: 'numeric'
        });
    };

    const getStatusClass = (status: string) => {
        switch (status) {
            case 'Aprovado':
                return 'bg-green-100 text-green-800';
            case 'Pendente':
                return 'bg-yellow-100 text-yellow-800';
            case 'Distribuído':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    if (carregando) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <div className="container mx-auto p-6 max-w-7xl">
                <button
                    onClick={() => router.back()}
                    className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
                >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Voltar
                </button>

                <div className="bg-white rounded-lg shadow-lg p-6">
                    <h1 className="text-2xl font-bold mb-6 flex items-center">
                        <Calendar className="w-6 h-6 mr-2" />
                        Calendário de Distribuição
                    </h1>

                    {/* Estatísticas do Mês */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-blue-600">Total de Guias</p>
                                    <p className="text-2xl font-bold text-blue-900">
                                        {estatisticasMes.totalGuias}
                                    </p>
                                </div>
                                <FileText className="w-8 h-8 text-blue-300" />
                            </div>
                        </div>

                        <div className="bg-green-50 p-4 rounded-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-green-600">Distribuídas</p>
                                    <p className="text-2xl font-bold text-green-900">
                                        {estatisticasMes.guiasDistribuidas}
                                    </p>
                                </div>
                                <CheckCircle className="w-8 h-8 text-green-300" />
                            </div>
                        </div>

                        <div className="bg-purple-50 p-4 rounded-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-purple-600">Dias de Distribuição</p>
                                    <p className="text-2xl font-bold text-purple-900">
                                        {estatisticasMes.diasComDistribuicao}
                                    </p>
                                </div>
                                <Calendar className="w-8 h-8 text-purple-300" />
                            </div>
                        </div>

                        <div className="bg-orange-50 p-4 rounded-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-orange-600">Instituições</p>
                                    <p className="text-2xl font-bold text-orange-900">
                                        {estatisticasMes.instituicoesAtendidas}
                                    </p>
                                </div>
                                <Building2 className="w-8 h-8 text-orange-300" />
                            </div>
                        </div>
                    </div>

                    {/* Navegação do Calendário */}
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={() => navegarMes('anterior')}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <h2 className="text-xl font-semibold capitalize">
                            {formatarMesAno(mesAtual)}
                        </h2>
                        <button
                            onClick={() => navegarMes('proximo')}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                            <ChevronRight className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Calendário */}
                    <div className="border rounded-lg overflow-hidden">
                        <div className="grid grid-cols-7 bg-gray-50">
                            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(dia => (
                                <div key={dia} className="p-3 text-center font-semibold text-gray-700 text-sm">
                                    {dia}
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7">
                            {diasCalendario.map((dia, index) => (
                                <div
                                    key={index}
                                    onClick={() => selecionarDia(dia)}
                                    className={`
                                        min-h-[100px] p-2 border-r border-b cursor-pointer
                                        ${!dia.mesAtual ? 'bg-gray-50 text-gray-400' : 'bg-white hover:bg-gray-50'}
                                        ${dia.guias.length > 0 ? 'relative' : ''}
                                    `}
                                >
                                    <div className="font-medium mb-1">{dia.dia}</div>
                                    {dia.mesAtual && (
                                        <>
                                            {dia.guias.length > 0 && (
                                                <div className="absolute top-2 right-2">
                                                    <div className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                                        {dia.guias.length}
                                                    </div>
                                                </div>
                                            )}
                                            {dia.temDistribuicao && (
                                                <div className="mt-1">
                                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                                </div>
                                            )}
                                            {dia.guias.length > 0 && (
                                                <div className="mt-2 space-y-1">
                                                    {dia.guias.slice(0, 2).map((guia, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="text-xs p-1 rounded bg-blue-100 text-blue-800 truncate"
                                                        >
                                                            {guia.instituicaoNome}
                                                        </div>
                                                    ))}
                                                    {dia.guias.length > 2 && (
                                                        <div className="text-xs text-gray-500">
                                                            +{dia.guias.length - 2} mais
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Legenda */}
                    <div className="mt-4 flex items-center space-x-6 text-sm">
                        <div className="flex items-center">
                            <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
                            <span>Guias no período</span>
                        </div>
                        <div className="flex items-center">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                            <span>Dia com distribuição</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de Detalhes do Dia */}
            {modalAberto && diaSelecionado && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
                        <div className="p-6 border-b">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold">
                                    {formatarData(diaSelecionado.data)}
                                </h3>
                                <button
                                    onClick={() => setModalAberto(false)}
                                    className="p-2 hover:bg-gray-100 rounded-lg"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[60vh]">
                            {diaSelecionado.guias.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">
                                    Nenhuma guia para este dia
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    {diaSelecionado.guias.map((guia) => (
                                        <div
                                            key={guia.id}
                                            className="border rounded-lg p-4 hover:bg-gray-50"
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <h4 className="font-semibold">{guia.instituicaoNome}</h4>
                                                    <p className="text-sm text-gray-500">
                                                        Guia #{guia.id.slice(-6)}
                                                    </p>
                                                </div>
                                                <span className={`px-2 py-1 rounded-full text-xs ${getStatusClass(guia.status)}`}>
                                                    {guia.status}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <div>
                                                    <span className="text-gray-500">Período:</span>
                                                    <p className="font-medium">
                                                        {new Date(guia.dataInicio).toLocaleDateString('pt-BR')} -
                                                        {new Date(guia.dataFim).toLocaleDateString('pt-BR')}
                                                    </p>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Status:</span>
                                                    <p className="font-medium">{guia.status}</p>
                                                </div>
                                            </div>
                                            {guia.observacoes && (
                                                <div className="mt-2">
                                                    <span className="text-gray-500 text-sm">Observações:</span>
                                                    <p className="text-sm">{guia.observacoes}</p>
                                                </div>
                                            )}
                                            <div className="mt-3 flex justify-end">
                                                <button
                                                    onClick={() => {
                                                        setModalAberto(false);
                                                        router.push(`/guia-abastecimento/${guia.id}`);
                                                    }}
                                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                >
                                                    Ver detalhes →
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}