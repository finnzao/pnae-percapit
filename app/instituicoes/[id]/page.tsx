'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Instituicao, AlunoAtipico } from '@/types';
import Header from '@/components/Header';
import { ArrowLeft, Building2, MapPin, Users, Edit, Trash2, AlertCircle } from 'lucide-react';
import { usePreventDoubleClick } from '@/hooks/usePreventDoubleClick';

export default function InstituicaoDetalhe() {
    const router = useRouter();
    const params = useParams();
    const [instituicao, setInstituicao] = useState<Instituicao | null>(null);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);
    const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);

    // Hook para prevenir duplo clique na desativação
    const { handleClick: handleDesativarClick, isLoading: desativando } = usePreventDoubleClick(
        async () => {
            await desativarInstituicaoAsync();
        },
        {
            delay: 1500,
            onError: (error) => setErro(error.message),
            onSuccess: () => {
                router.push('/instituicoes');
            }
        }
    );

    useEffect(() => {
        if (params.id) {
            carregarInstituicao(params.id as string);
        }
    }, [params.id]);

    const carregarInstituicao = async (id: string) => {
        try {
            const response = await fetch('/api/salvar-instituicao');
            const data = await response.json();

            if (data.ok) {
                const instituicaoEncontrada = data.data.find((i: Instituicao) => i.id === id);
                if (instituicaoEncontrada) {
                    setInstituicao(instituicaoEncontrada);
                } else {
                    setErro('Instituição não encontrada');
                }
            } else {
                setErro('Erro ao carregar instituição');
            }
        } catch (error) {
            console.error('Erro ao carregar instituição:', error);
            setErro('Erro ao conectar com o servidor');
        } finally {
            setCarregando(false);
        }
    };

    const calcularAlunosComRestricao = (alunosAtipicos: AlunoAtipico[]) => {
        return alunosAtipicos.reduce((total, atipico) => total + atipico.quantidade, 0);
    };

    const formatarData = (dataString: string | Date) => {
        const data = new Date(dataString);
        return data.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    };

    const desativarInstituicaoAsync = async () => {
        if (!instituicao) return;

        const response = await fetch('/api/salvar-instituicao', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: instituicao.id,
                ativo: false
            })
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Erro ao desativar instituição');
        }
    };

    const desativarInstituicao = () => {
        handleDesativarClick();
    };

    if (carregando) {
        return (
            <div className="min-h-screen bg-[#FAFAF8]">
                <Header />
                <main className="page-container">
                    <div className="flex justify-center items-center h-64">
                        <p className="text-center text-gray-500">Carregando instituição...</p>
                    </div>
                </main>
            </div>
        );
    }

    if (erro || !instituicao) {
        return (
            <div className="min-h-screen bg-[#FAFAF8]">
                <Header />
                <main className="page-container">
                    <button
                        onClick={() => router.push('/instituicoes')}
                        className="flex items-center gap-2 text-[#4C6E5D] hover:text-[#6B7F66] mb-6 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Voltar às instituições</span>
                    </button>

                    <div className="bg-red-50 border border-red-200 text-red-700 p-8 rounded-lg text-center">
                        <p className="text-lg font-medium mb-4">{erro || 'Instituição não encontrada'}</p>
                        <button
                            onClick={() => router.push('/instituicoes')}
                            className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
                        >
                            Voltar às Instituições
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
                {/* Navegação */}
                <button
                    onClick={() => router.push('/instituicoes')}
                    className="flex items-center gap-2 text-[#4C6E5D] hover:text-[#6B7F66] mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Voltar às instituições</span>
                </button>

                {/* Cabeçalho da Instituição */}
                <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-[#4C6E5D] mb-2">{instituicao.nome}</h1>
                            <p className="text-lg text-gray-600">{instituicao.tipo}</p>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => router.push(`/instituicoes/editar/${instituicao.id}`)}
                                className="p-2 text-gray-600 hover:text-[#4C6E5D] hover:bg-gray-50 rounded-lg transition"
                                title="Editar instituição"
                            >
                                <Edit className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setMostrarConfirmacao(true)}
                                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                title="Desativar instituição"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#C8D5B9] rounded-lg flex items-center justify-center">
                                <Users className="w-5 h-5 text-[#4C6E5D]" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Total de Alunos</p>
                                <p className="text-xl font-semibold">{instituicao.totalAlunos}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#C8D5B9] rounded-lg flex items-center justify-center">
                                <AlertCircle className="w-5 h-5 text-[#4C6E5D]" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Com Restrições</p>
                                <p className="text-xl font-semibold">{calcularAlunosComRestricao(instituicao.alunosAtipicos)}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#C8D5B9] rounded-lg flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-[#4C6E5D]" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Cadastrado em</p>
                                <p className="text-xl font-semibold">{formatarData(instituicao.dataCadastro)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Endereço */}
                <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
                    <h2 className="text-xl font-semibold text-[#4C6E5D] mb-4 flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
                        Endereço
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-600">
                        <div>
                            <p className="font-medium">Logradouro</p>
                            <p>{instituicao.endereco.logradouro}, {instituicao.endereco.numero}</p>
                            {instituicao.endereco.complemento && (
                                <p className="text-sm">{instituicao.endereco.complemento}</p>
                            )}
                        </div>
                        <div>
                            <p className="font-medium">Bairro</p>
                            <p>{instituicao.endereco.bairro}</p>
                        </div>
                        <div>
                            <p className="font-medium">Cidade/Estado</p>
                            <p>{instituicao.endereco.cidade}/{instituicao.endereco.estado}</p>
                        </div>
                        <div>
                            <p className="font-medium">CEP</p>
                            <p>{instituicao.endereco.cep}</p>
                        </div>
                    </div>
                </div>

                {/* Restrições Alimentares */}
                {instituicao.alunosAtipicos.length > 0 && (
                    <div className="bg-white p-6 rounded-xl shadow-sm">
                        <h2 className="text-xl font-semibold text-[#4C6E5D] mb-4">
                            Alunos com Restrições Alimentares
                        </h2>
                        <div className="space-y-3">
                            {instituicao.alunosAtipicos.map((atipico, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-4 bg-red-50 rounded-lg"
                                >
                                    <span className="font-medium text-red-700">{atipico.restricaoNome}</span>
                                    <span className="text-lg font-semibold text-red-800">
                                        {atipico.quantidade} {atipico.quantidade === 1 ? 'aluno' : 'alunos'}
                                    </span>
                                </div>
                            ))}
                            <div className="pt-4 border-t border-gray-200">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Total de alunos com restrições:</span>
                                    <span className="text-xl font-bold text-[#4C6E5D]">
                                        {calcularAlunosComRestricao(instituicao.alunosAtipicos)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-gray-600">Percentual do total:</span>
                                    <span className="text-lg font-semibold text-[#4C6E5D]">
                                        {((calcularAlunosComRestricao(instituicao.alunosAtipicos) / instituicao.totalAlunos) * 100).toFixed(1)}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal de Confirmação */}
                {mostrarConfirmacao && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full">
                            <h3 className="text-xl font-semibold mb-4">Confirmar Desativação</h3>
                            <p className="text-gray-600 mb-6">
                                Tem certeza que deseja desativar a instituição {`"${instituicao.nome}"`}?
                                Esta ação pode ser revertida posteriormente.
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setMostrarConfirmacao(false)}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={desativarInstituicao}
                                    disabled={desativando}
                                    className={`px-4 py-2 rounded-md transition ${desativando
                                            ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                            : 'bg-red-600 text-white hover:bg-red-700'
                                        }`}
                                >
                                    {desativando ? 'Desativando...' : 'Desativar'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
