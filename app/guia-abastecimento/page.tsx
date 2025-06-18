'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { ArrowLeft, Plus, Calendar, FileText, CheckCircle, Clock, Package } from 'lucide-react';
import { GuiaAbastecimento } from '@/types';

export default function GuiaAbastecimentoPage() {
    const router = useRouter();
    const [guias, setGuias] = useState<GuiaAbastecimento[]>([]);
    const [carregando, setCarregando] = useState(true);

    useEffect(() => {
        carregarGuias();
    }, []);

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

    const formatarData = (dataString: string | Date) => {
        const data = new Date(dataString);
        return data.toLocaleDateString('pt-BR');
    };

    const formatarPeriodo = (inicio: string | Date, fim: string | Date) => {
        const dataInicio = new Date(inicio);
        const dataFim = new Date(fim);
        return `${formatarData(dataInicio)} a ${formatarData(dataFim)}`;
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Rascunho':
                return <Clock className="w-4 h-4" />;
            case 'Finalizado':
                return <CheckCircle className="w-4 h-4" />;
            case 'Distribuído':
                return <Package className="w-4 h-4" />;
            default:
                return <FileText className="w-4 h-4" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Rascunho':
                return 'bg-yellow-100 text-yellow-800';
            case 'Finalizado':
                return 'bg-blue-100 text-blue-800';
            case 'Distribuído':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    if (carregando) {
        return (
            <div className="min-h-screen bg-[#FAFAF8]">
                <Header />
                <main className="page-container">
                    <div className="flex justify-center items-center h-64">
                        <p className="text-center text-gray-500">Carregando guias de abastecimento...</p>
                    </div>
                </main>
            </div>
        );
    }

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

                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-[#4C6E5D]">Guias de Abastecimento</h1>
                    <button
                        onClick={() => router.push('/guia-abastecimento/criar')}
                        className="px-4 py-2 bg-[#4C6E5D] text-white rounded-md hover:bg-[#6B7F66] transition flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Nova Guia
                    </button>
                </div>

                {guias.length === 0 ? (
                    <div className="bg-white p-8 rounded-xl shadow-sm text-center">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                            <FileText className="w-10 h-10 text-gray-400" />
                        </div>
                        <p className="text-gray-600 mb-6">Nenhuma guia de abastecimento criada ainda.</p>
                        <button
                            onClick={() => router.push('/guia-abastecimento/criar')}
                            className="px-6 py-2 bg-[#4C6E5D] text-white rounded-md hover:bg-[#6B7F66] transition"
                        >
                            Criar Primeira Guia
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {guias.map((guia) => (
                            <div
                                key={guia.id}
                                className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer"
                                onClick={() => router.push(`/guia-abastecimento/${guia.id}`)}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <h2 className="text-xl font-bold flex-1">{guia.instituicaoNome || 'Instituição'}</h2>
                                    <span className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 ${getStatusColor(guia.status)}`}>
                                        {getStatusIcon(guia.status)}
                                        {guia.status}
                                    </span>
                                </div>

                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <Calendar className="w-4 h-4" />
                                        <span>Período: {formatarPeriodo(guia.dataInicio, guia.dataFim)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <FileText className="w-4 h-4" />
                                        <span>{guia.cardapiosDiarios.length} dias planejados</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <Package className="w-4 h-4" />
                                        <span>{guia.calculosDistribuicao.length} alimentos</span>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <p className="text-xs text-gray-500">
                                        Gerado em {formatarData(guia.dataGeracao)} • v{guia.versao}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}