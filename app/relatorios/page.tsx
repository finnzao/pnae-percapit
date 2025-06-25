'use client';

import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { ArrowLeft, TrendingUp, Package, Calendar, FileText } from 'lucide-react';

export default function RelatoriosPage() {
    const router = useRouter();

    const relatorios = [
        {
            titulo: 'Distribuição de Alimentos',
            descricao: 'Análise detalhada dos alimentos distribuídos por período, etapa e instituição',
            icone: <TrendingUp className="w-8 h-8" />,
            rota: '/relatorios/distribuicao',
            cor: 'bg-green-50 text-green-600'
        },
        {
            titulo: 'Consumo por Instituição',
            descricao: 'Relatório de consumo de alimentos por instituição',
            icone: <Package className="w-8 h-8" />,
            rota: '/relatorios/instituicao',
            cor: 'bg-blue-50 text-blue-600'
        },
        {
            titulo: 'Histórico de Guias',
            descricao: 'Visualize o histórico completo de guias de abastecimento',
            icone: <FileText className="w-8 h-8" />,
            rota: '/relatorios/guias',
            cor: 'bg-purple-50 text-purple-600'
        },
        {
            titulo: 'Calendário de Distribuição',
            descricao: 'Visualização mensal das distribuições realizadas',
            icone: <Calendar className="w-8 h-8" />,
            rota: '/relatorios/calendario',
            cor: 'bg-orange-50 text-orange-600'
        }
    ];

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

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-[#4C6E5D]">Relatórios</h1>
                    <p className="text-gray-600 mt-1">Análises e insights sobre a distribuição de alimentos</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {relatorios.map((relatorio, index) => (
                        <button
                            key={index}
                            onClick={() => router.push(relatorio.rota)}
                            className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all text-left group"
                        >
                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-lg ${relatorio.cor} group-hover:scale-110 transition-transform`}>
                                    {relatorio.icone}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-[#4C6E5D] mb-1">
                                        {relatorio.titulo}
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        {relatorio.descricao}
                                    </p>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </main>
        </div>
    );
}