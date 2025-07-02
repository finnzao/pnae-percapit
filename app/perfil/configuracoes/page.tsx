'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import ConfiguracoesAvancadas from '@/components/ConfiguracoesAvancadas';
import LoadingOverlay from '@/components/LoadingOverlay';
import { ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

export default function ConfiguracoesPage() {
    const router = useRouter();
    const [carregando, setCarregando] = useState(false);
    const [mensagem, setMensagem] = useState<{
        tipo: 'sucesso' | 'erro' | 'aviso';
        texto: string;
    } | null>(null);

    const handleExportarDados = async () => {
        try {
            setCarregando(true);
            setMensagem(null);

            // Simular preparação dos dados
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Criar dados simulados para export
            const dadosExport = {
                perfil: {
                    nome: 'Ana Paula Silva',
                    email: 'ana.paula@nutrigestao.com',
                    cargo: 'Nutricionista',
                    dataCadastro: new Date().toISOString()
                },
                atividades: {
                    guiasGeradas: 25,
                    cardapiosCriados: 15,
                    calculosRealizados: 150
                },
                configuracoes: {
                    notificacoesEmail: true,
                    temaEscuro: false,
                    idiomaPreferido: 'pt-BR'
                },
                exportadoEm: new Date().toISOString()
            };

            // Criar e baixar arquivo
            const blob = new Blob([JSON.stringify(dadosExport, null, 2)], {
                type: 'application/json'
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `nutrigestao-dados-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setMensagem({
                tipo: 'sucesso',
                texto: 'Dados exportados com sucesso!'
            });
        } catch (error) {
            setMensagem({
                tipo: 'erro',
                texto: `Erro ao exportar dados. Tente novamente.${error}`
            });
        } finally {
            setCarregando(false);
        }
    };

    const handleExcluirConta = async () => {
        try {
            setCarregando(true);
            setMensagem(null);

            // Simular processo de exclusão
            await new Promise(resolve => setTimeout(resolve, 3000));

            setMensagem({
                tipo: 'sucesso',
                texto: 'Conta excluída com sucesso. Você será redirecionado para a página de login.'
            });

            // Simular redirecionamento após exclusão
            setTimeout(() => {
                // Aqui você redirecionaria para a página de login
                router.push('/');
            }, 3000);
        } catch (error) {
            setMensagem({
                tipo: 'erro',
                texto: `Erro ao excluir conta. Entre em contato com o suporte.${error}`
            });
            setCarregando(false);
        }
    };

    const handleLimparCache = async () => {
        try {
            setCarregando(true);
            setMensagem(null);

            // Simular limpeza de cache
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Limpar localStorage/sessionStorage se necessário
            if (typeof window !== 'undefined') {
                // Exemplo: localStorage.clear();
                // sessionStorage.clear();
            }

            setMensagem({
                tipo: 'sucesso',
                texto: 'Cache limpo com sucesso!'
            });
        } catch (error) {
            setMensagem({
                tipo: 'erro',
                texto: `Erro ao limpar cache. Tente novamente: ${error}`
            });
        } finally {
            setCarregando(false);
        }
    };

    const limparMensagem = () => {
        setMensagem(null);
    };

    return (
        <div className="min-h-screen bg-[#FAFAF8]">
            <Header />

            <main className="page-container">
                {/* Loading Overlay */}
                <LoadingOverlay
                    isLoading={carregando}
                    message="Processando..."
                    overlay={true}
                    size="lg"
                />

                {/* Navegação */}
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => router.push('/perfil')}
                        className="flex items-center gap-2 text-[#4C6E5D] hover:text-[#6B7F66] transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Voltar ao Perfil</span>
                    </button>
                    <div className="h-4 w-px bg-gray-300"></div>
                    <nav className="flex items-center gap-2 text-sm text-gray-600">
                        <button
                            onClick={() => router.push('/perfil')}
                            className="hover:text-[#4C6E5D] transition-colors"
                        >
                            Perfil
                        </button>
                        <span>→</span>
                        <span className="text-[#4C6E5D] font-medium">Configurações Avançadas</span>
                    </nav>
                </div>

                {/* Cabeçalho */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-[#4C6E5D] mb-2">
                        Configurações Avançadas
                    </h1>
                    <p className="text-gray-600">
                        Gerencie configurações de segurança, privacidade e dados da conta
                    </p>
                </div>

                {/* Mensagens de Feedback */}
                {mensagem && (
                    <div className={`mb-6 p-4 rounded-lg border flex items-start gap-3 ${mensagem.tipo === 'sucesso'
                        ? 'bg-green-50 border-green-200 text-green-700'
                        : mensagem.tipo === 'erro'
                            ? 'bg-red-50 border-red-200 text-red-700'
                            : 'bg-yellow-50 border-yellow-200 text-yellow-700'
                        }`}>
                        {mensagem.tipo === 'sucesso' ? (
                            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        ) : (
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        )}
                        <p className="flex-1">{mensagem.texto}</p>
                        <button
                            onClick={limparMensagem}
                            className="text-current hover:opacity-70 transition-opacity"
                        >
                            ×
                        </button>
                    </div>
                )}

                {/* Conteúdo Principal */}
                <div className="max-w-4xl">
                    <ConfiguracoesAvancadas
                        onExportarDados={handleExportarDados}
                        onExcluirConta={handleExcluirConta}
                        onLimparCache={handleLimparCache}
                        carregando={carregando}
                    />
                </div>

                {/* Informações Adicionais */}
                <div className="mt-8 max-w-4xl">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="font-medium text-blue-900 mb-2">
                            Informações Importantes
                        </h3>
                        <ul className="text-sm text-blue-800 space-y-1">
                            <li>• As configurações de segurança são aplicadas imediatamente</li>
                            <li>• A exportação de dados inclui apenas informações não sensíveis</li>
                            <li>• A exclusão da conta é permanente e não pode ser desfeita</li>
                            <li>• Entre em contato com o suporte se precisar de ajuda</li>
                        </ul>
                    </div>
                </div>

                {/* Links Úteis */}
                <div className="mt-6 max-w-4xl">
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h3 className="font-medium text-gray-900 mb-4">
                            Links Úteis
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <a
                                href="#"
                                className="text-[#4C6E5D] hover:text-[#6B7F66] transition-colors text-sm"
                                onClick={(e) => {
                                    e.preventDefault();
                                    // Implementar navegação para política de privacidade
                                }}
                            >
                                Política de Privacidade
                            </a>
                            <a
                                href="#"
                                className="text-[#4C6E5D] hover:text-[#6B7F66] transition-colors text-sm"
                                onClick={(e) => {
                                    e.preventDefault();
                                    // Implementar navegação para termos de uso
                                }}
                            >
                                Termos de Uso
                            </a>
                            <a
                                href="#"
                                className="text-[#4C6E5D] hover:text-[#6B7F66] transition-colors text-sm"
                                onClick={(e) => {
                                    e.preventDefault();
                                    // Implementar navegação para central de ajuda
                                }}
                            >
                                Central de Ajuda
                            </a>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}