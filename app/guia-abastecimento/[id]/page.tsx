'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '@/components/Header';
import { ArrowLeft, Download, Package, Clock, CheckCircle, Printer } from 'lucide-react';
import { GuiaAbastecimento } from '@/types';
import { usePreventDoubleClick } from '@/hooks/usePreventDoubleClick';

export default function GuiaDetalhe() {
    const router = useRouter();
    const params = useParams();
    const [guia, setGuia] = useState<GuiaAbastecimento | null>(null);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);

    // Hook para prevenir duplo clique na atualização de status
    const { handleClick: handleAtualizarStatus, isLoading: atualizandoStatus } = usePreventDoubleClick(
        async (novoStatus: 'Rascunho' | 'Finalizado' | 'Distribuído') => {
            await atualizarStatusAsync(novoStatus);
        },
        {
            delay: 1500,
            onError: (error) => setErro(error.message)
        }
    );

    useEffect(() => {
        if (params.id) {
            carregarGuia(params.id as string);
        }
    }, [params.id]);

    const carregarGuia = async (id: string) => {
        try {
            const response = await fetch('/api/guia-abastecimento');
            const data = await response.json();

            if (data.ok) {
                const guiaEncontrada = data.data.find((g: GuiaAbastecimento) => g.id === id);
                if (guiaEncontrada) {
                    setGuia(guiaEncontrada);
                } else {
                    setErro('Guia não encontrada');
                }
            } else {
                setErro('Erro ao carregar guia');
            }
        } catch (error) {
            console.error('Erro ao carregar guia:', error);
            setErro('Erro ao conectar com o servidor');
        } finally {
            setCarregando(false);
        }
    };

    const formatarData = (dataString: string | Date) => {
        const data = new Date(dataString);
        return data.toLocaleDateString('pt-BR');
    };

    const formatarPeriodo = (inicio: string | Date, fim: string | Date) => {
        const dataInicio = new Date(inicio);
        const dataFim = new Date(fim);
        return `${formatarData(dataInicio)} a ${formatarData(dataFim)}`;
    };

    const getDiaSemana = (data: Date) => {
        const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        return dias[new Date(data).getDay()];
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Rascunho':
                return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 'Finalizado':
                return 'bg-blue-100 text-blue-800 border-blue-300';
            case 'Distribuído':
                return 'bg-green-100 text-green-800 border-green-300';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    const atualizarStatusAsync = async (novoStatus: 'Rascunho' | 'Finalizado' | 'Distribuído') => {
        if (!guia) return;

        const response = await fetch('/api/guia-abastecimento', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: guia.id,
                status: novoStatus
            })
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Erro ao atualizar status');
        }

        const data = await response.json();
        setGuia(data.data);
    };

    const atualizarStatus = (novoStatus: 'Rascunho' | 'Finalizado' | 'Distribuído') => {
        handleAtualizarStatus(novoStatus);
    };

    const exportarGuia = () => {
        if (!guia) return;

        let conteudo = `GUIA DE ABASTECIMENTO\n`;
        conteudo += `==================\n\n`;
        conteudo += `Instituição: ${guia.instituicaoNome}\n`;
        conteudo += `Período: ${formatarPeriodo(guia.dataInicio, guia.dataFim)}\n`;
        conteudo += `Status: ${guia.status}\n`;
        conteudo += `Gerado em: ${formatarData(guia.dataGeracao)}\n`;
        conteudo += `Por: ${guia.usuarioGeracao}\n`;
        conteudo += `Versão: ${guia.versao}\n\n`;

        conteudo += `CARDÁPIOS POR DIA\n`;
        conteudo += `-----------------\n`;
        guia.cardapiosDiarios.forEach(dia => {
            conteudo += `${formatarData(dia.data)} - ${getDiaSemana(dia.data)}: ${dia.cardapioNome}\n`;
        });

        conteudo += `\nALIMENTOS CONSOLIDADOS\n`;
        conteudo += `---------------------\n`;
        guia.calculosDistribuicao.forEach(calc => {
            conteudo += `\n${calc.alimentoNome}: ${calc.quantidadeTotal.toFixed(2)} ${calc.unidadeMedida}\n`;
            calc.detalhamentoRefeicoes.forEach(det => {
                conteudo += `  - ${det.refeicaoNome}: ${det.quantidade.toFixed(2)} ${calc.unidadeMedida}\n`;
            });
        });

        if (guia.observacoes) {
            conteudo += `\nOBSERVAÇÕES\n`;
            conteudo += `-----------\n`;
            conteudo += guia.observacoes;
        }

        const blob = new Blob([conteudo], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `guia-abastecimento-${guia.id}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (carregando) {
        return (
            <div className="min-h-screen bg-[#FAFAF8]">
                <Header />
                <main className="page-container">
                    <div className="flex justify-center items-center h-64">
                        <p className="text-center text-gray-500">Carregando guia...</p>
                    </div>
                </main>
            </div>
        );
    }

    if (erro || !guia) {
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

                    <div className="bg-red-50 border border-red-200 text-red-700 p-8 rounded-lg text-center">
                        <p className="text-lg font-medium mb-4">{erro || 'Guia não encontrada'}</p>
                        <button
                            onClick={() => router.push('/guia-abastecimento')}
                            className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
                        >
                            Voltar às Guias
                        </button>
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

                {/* Cabeçalho */}
                <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-[#4C6E5D] mb-2">{guia.instituicaoNome}</h1>
                            <p className="text-lg text-gray-600">
                                Guia de Abastecimento - {formatarPeriodo(guia.dataInicio, guia.dataFim)}
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 text-sm rounded-full border ${getStatusColor(guia.status)}`}>
                                {guia.status}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div className="text-sm">
                            <p className="text-gray-500">Gerado em</p>
                            <p className="font-medium">{formatarData(guia.dataGeracao)}</p>
                        </div>
                        <div className="text-sm">
                            <p className="text-gray-500">Por</p>
                            <p className="font-medium">{guia.usuarioGeracao}</p>
                        </div>
                        <div className="text-sm">
                            <p className="text-gray-500">Versão</p>
                            <p className="font-medium">v{guia.versao}</p>
                        </div>
                        <div className="text-sm">
                            <p className="text-gray-500">Dias planejados</p>
                            <p className="font-medium">{guia.cardapiosDiarios.length} dias</p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={exportarGuia}
                            className="px-4 py-2 bg-[#4C6E5D] text-white rounded-lg hover:bg-[#6B7F66] transition flex items-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            Exportar
                        </button>
                        <button
                            onClick={() => window.print()}
                            className="px-4 py-2 border border-[#4C6E5D] text-[#4C6E5D] rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
                        >
                            <Printer className="w-4 h-4" />
                            Imprimir
                        </button>
                    </div>
                </div>

                {/* Status da Guia */}
                <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
                    <h2 className="text-xl font-semibold text-[#4C6E5D] mb-4">Status da Guia</h2>
                    <div className="flex gap-4">
                        <button
                            onClick={() => atualizarStatus('Rascunho')}
                            disabled={atualizandoStatus || guia.status === 'Rascunho'}
                            className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${guia.status === 'Rascunho'
                                    ? 'bg-yellow-100 text-yellow-800 cursor-not-allowed'
                                    : 'bg-gray-100 hover:bg-yellow-100 hover:text-yellow-800'
                                }`}
                        >
                            <Clock className="w-4 h-4" />
                            Rascunho
                        </button>
                        <button
                            onClick={() => atualizarStatus('Finalizado')}
                            disabled={atualizandoStatus || guia.status === 'Finalizado'}
                            className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${guia.status === 'Finalizado'
                                    ? 'bg-blue-100 text-blue-800 cursor-not-allowed'
                                    : 'bg-gray-100 hover:bg-blue-100 hover:text-blue-800'
                                }`}
                        >
                            <CheckCircle className="w-4 h-4" />
                            Finalizado
                        </button>
                        <button
                            onClick={() => atualizarStatus('Distribuído')}
                            disabled={atualizandoStatus || guia.status === 'Distribuído'}
                            className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${guia.status === 'Distribuído'
                                    ? 'bg-green-100 text-green-800 cursor-not-allowed'
                                    : 'bg-gray-100 hover:bg-green-100 hover:text-green-800'
                                }`}
                        >
                            <Package className="w-4 h-4" />
                            Distribuído
                        </button>
                    </div>
                </div>

                {/* Cardápios por Dia */}
                <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
                    <h2 className="text-xl font-semibold text-[#4C6E5D] mb-4">Cardápios por Dia</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {guia.cardapiosDiarios.map((dia, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                    <p className="font-medium">{formatarData(dia.data)}</p>
                                    <p className="text-sm text-gray-600">{getDiaSemana(dia.data)}</p>
                                </div>
                                <p className="text-sm font-medium text-[#4C6E5D]">{dia.cardapioNome}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Alimentos Consolidados */}
                <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
                    <h2 className="text-xl font-semibold text-[#4C6E5D] mb-4">Alimentos Consolidados</h2>
                    <div className="space-y-4">
                        {guia.calculosDistribuicao.map((calc, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className="font-semibold text-lg">{calc.alimentoNome}</h3>
                                    <span className="text-lg font-bold text-[#4C6E5D]">
                                        {calc.quantidadeTotal.toFixed(2)} {calc.unidadeMedida}
                                    </span>
                                </div>
                                {calc.detalhamentoRefeicoes.length > 0 && (
                                    <div className="space-y-1 text-sm text-gray-600">
                                        {calc.detalhamentoRefeicoes.map((det, i) => (
                                            <div key={i} className="flex justify-between">
                                                <span>{det.refeicaoNome}</span>
                                                <span>{det.quantidade.toFixed(2)} {calc.unidadeMedida}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Observações */}
                {guia.observacoes && (
                    <div className="bg-white p-6 rounded-xl shadow-sm">
                        <h2 className="text-xl font-semibold text-[#4C6E5D] mb-4">Observações</h2>
                        <p className="text-gray-700 whitespace-pre-wrap">{guia.observacoes}</p>
                    </div>
                )}
            </main>
        </div>
    );
}