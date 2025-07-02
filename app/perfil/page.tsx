'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import LoadingOverlay from '@/components/LoadingOverlay';
import { usePreventDoubleClick } from '@/hooks/usePreventDoubleClick';
import {
    ArrowLeft,
    User,
    Mail,
    Lock,
    Save,
    Eye,
    EyeOff,
    Calendar,
    Shield,
    Settings,
    AlertCircle,
    CheckCircle,
    Bell,
    Palette
} from 'lucide-react';

interface PerfilUsuario {
    id: string;
    nome: string;
    email: string;
    cargo: string;
    dataUltimoLogin: Date;
    dataCadastro: Date;
    ativo: boolean;
    configuracoes: {
        notificacoesEmail: boolean;
        notificacoesPush: boolean;
        temaEscuro: boolean;
        idiomaPreferido: string;
    };
}

interface AlterarSenhaData {
    senhaAtual: string;
    novaSenha: string;
    confirmarSenha: string;
}

export default function PerfilPage() {
    const router = useRouter();
    const [usuario, setUsuario] = useState<PerfilUsuario | null>(null);
    const [carregando, setCarregando] = useState(true);
    const [editando, setEditando] = useState(false);
    const [mostrarAlterarSenha, setMostrarAlterarSenha] = useState(false);
    const [mostrarSenhas, setMostrarSenhas] = useState({
        atual: false,
        nova: false,
        confirmar: false
    });

    // Estados para formulários
    const [dadosEdicao, setDadosEdicao] = useState<Partial<PerfilUsuario>>({});
    const [senhaData, setSenhaData] = useState<AlterarSenhaData>({
        senhaAtual: '',
        novaSenha: '',
        confirmarSenha: ''
    });

    // Estados para feedback
    const [mensagem, setMensagem] = useState<{
        tipo: 'sucesso' | 'erro' | 'aviso';
        texto: string;
    } | null>(null);

    // Carregar dados do usuário
    useEffect(() => {
        carregarDadosUsuario();
    }, []);

    const carregarDadosUsuario = async () => {
        try {
            setCarregando(true);

            // Simulando dados do usuário - substituir por API real
            const dadosSimulados: PerfilUsuario = {
                id: '1',
                nome: 'Ana Paula Silva',
                email: 'ana.paula@nutrigestao.com',
                cargo: 'Nutricionista',
                dataUltimoLogin: new Date(),
                dataCadastro: new Date('2023-01-15'),
                ativo: true,
                configuracoes: {
                    notificacoesEmail: true,
                    notificacoesPush: false,
                    temaEscuro: false,
                    idiomaPreferido: 'pt-BR'
                }
            };

            // Simular delay de API
            await new Promise(resolve => setTimeout(resolve, 1000));

            setUsuario(dadosSimulados);
            setDadosEdicao(dadosSimulados);
        } catch (error) {
            setMensagem({
                tipo: 'erro',
                texto: `Erro ao carregar dados do perfil:${error}`
            });
        } finally {
            setCarregando(false);
        }
    };

    const { handleClick: salvarPerfil, isLoading: salvandoPerfil } = usePreventDoubleClick(
        async () => {
            try {
                // Validações básicas
                if (!dadosEdicao.nome?.trim()) {
                    throw new Error('Nome é obrigatório');
                }
                if (!dadosEdicao.email?.trim()) {
                    throw new Error('Email é obrigatório');
                }

                // Simular API de atualização
                await new Promise(resolve => setTimeout(resolve, 1500));

                setUsuario(dadosEdicao as PerfilUsuario);
                setEditando(false);
                setMensagem({
                    tipo: 'sucesso',
                    texto: 'Perfil atualizado com sucesso!'
                });
            } catch (error) {
                setMensagem({
                    tipo: 'erro',
                    texto: error instanceof Error ? error.message : 'Erro ao salvar perfil'
                });
            }
        },
        { delay: 2000 }
    );

    const { handleClick: alterarSenha, isLoading: alterandoSenha } = usePreventDoubleClick(
        async () => {
            try {
                // Validações
                if (!senhaData.senhaAtual) {
                    throw new Error('Senha atual é obrigatória');
                }
                if (!senhaData.novaSenha) {
                    throw new Error('Nova senha é obrigatória');
                }
                if (senhaData.novaSenha.length < 8) {
                    throw new Error('Nova senha deve ter pelo menos 8 caracteres');
                }
                if (senhaData.novaSenha !== senhaData.confirmarSenha) {
                    throw new Error('Confirmação de senha não confere');
                }

                // Simular API de alteração de senha
                await new Promise(resolve => setTimeout(resolve, 2000));

                setSenhaData({
                    senhaAtual: '',
                    novaSenha: '',
                    confirmarSenha: ''
                });
                setMostrarAlterarSenha(false);
                setMensagem({
                    tipo: 'sucesso',
                    texto: 'Senha alterada com sucesso!'
                });
            } catch (error) {
                setMensagem({
                    tipo: 'erro',
                    texto: error instanceof Error ? error.message : 'Erro ao alterar senha'
                });
            }
        },
        { delay: 2000 }
    );

    const alternarConfiguracoes = (chave: keyof PerfilUsuario['configuracoes']) => {
        if (!dadosEdicao.configuracoes) return;

        setDadosEdicao(prev => ({
            ...prev,
            configuracoes: {
                ...prev.configuracoes!,
                [chave]: !prev.configuracoes![chave]
            }
        }));
    };

    const formatarData = (data: Date) => {
        return new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(data);
    };

    const limparMensagem = () => {
        setTimeout(() => setMensagem(null), 5000);
    };

    useEffect(() => {
        if (mensagem) {
            limparMensagem();
        }
    }, [mensagem]);

    if (carregando) {
        return (
            <div className="min-h-screen bg-[#FAFAF8]">
                <Header />
                <LoadingOverlay
                    isLoading={true}
                    message="Carregando perfil..."
                    overlay={true}
                    size="lg"
                />
            </div>
        );
    }

    if (!usuario) {
        return (
            <div className="min-h-screen bg-[#FAFAF8]">
                <Header />
                <main className="page-container">
                    <div className="text-center py-12">
                        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            Erro ao carregar perfil
                        </h2>
                        <p className="text-gray-600 mb-4">
                            Não foi possível carregar os dados do seu perfil.
                        </p>
                        <button
                            onClick={carregarDadosUsuario}
                            className="btn-primary"
                        >
                            Tentar Novamente
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
                    onClick={() => router.push('/')}
                    className="flex items-center gap-2 text-[#4C6E5D] hover:text-[#6B7F66] mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Voltar ao início</span>
                </button>

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
                        <p>{mensagem.texto}</p>
                        <button
                            onClick={() => setMensagem(null)}
                            className="ml-auto text-current hover:opacity-70"
                        >
                            ×
                        </button>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Sidebar - Informações do Usuário */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                            <div className="text-center">
                                <div className="w-20 h-20 bg-[#4C6E5D] rounded-full flex items-center justify-center mx-auto mb-4">
                                    <User className="w-10 h-10 text-white" />
                                </div>
                                <h2 className="text-xl font-semibold text-gray-900 mb-1">
                                    {usuario.nome}
                                </h2>
                                <p className="text-gray-600 mb-2">{usuario.cargo}</p>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${usuario.ativo
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                    }`}>
                                    {usuario.ativo ? 'Ativo' : 'Inativo'}
                                </span>
                            </div>

                            <div className="mt-6 space-y-3 text-sm">
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Mail className="w-4 h-4" />
                                    <span>{usuario.email}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Calendar className="w-4 h-4" />
                                    <span>Cadastro: {formatarData(usuario.dataCadastro)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Shield className="w-4 h-4" />
                                    <span>Último login: {formatarData(usuario.dataUltimoLogin)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Menu de Ações */}
                        <div className="bg-white rounded-xl shadow-sm p-4">
                            <h3 className="font-medium text-gray-900 mb-3">Ações Rápidas</h3>
                            <div className="space-y-2">
                                <button
                                    onClick={() => setMostrarAlterarSenha(true)}
                                    className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                                >
                                    <Lock className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm">Alterar Senha</span>
                                </button>
                                <button
                                    onClick={() => setEditando(!editando)}
                                    className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                                >
                                    <Settings className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm">
                                        {editando ? 'Cancelar Edição' : 'Editar Perfil'}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Conteúdo Principal */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Informações Pessoais */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Informações Pessoais
                                </h3>
                                {!editando && (
                                    <button
                                        onClick={() => setEditando(true)}
                                        className="text-[#4C6E5D] hover:text-[#6B7F66] text-sm font-medium"
                                    >
                                        Editar
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nome Completo
                                    </label>
                                    <input
                                        type="text"
                                        value={dadosEdicao.nome || ''}
                                        onChange={(e) => setDadosEdicao(prev => ({ ...prev, nome: e.target.value }))}
                                        disabled={!editando}
                                        className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4C6E5D] focus:border-transparent ${!editando ? 'bg-gray-50 text-gray-600' : 'bg-white'
                                            }`}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={dadosEdicao.email || ''}
                                        onChange={(e) => setDadosEdicao(prev => ({ ...prev, email: e.target.value }))}
                                        disabled={!editando}
                                        className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4C6E5D] focus:border-transparent ${!editando ? 'bg-gray-50 text-gray-600' : 'bg-white'
                                            }`}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Cargo
                                    </label>
                                    <input
                                        type="text"
                                        value={dadosEdicao.cargo || ''}
                                        onChange={(e) => setDadosEdicao(prev => ({ ...prev, cargo: e.target.value }))}
                                        disabled={!editando}
                                        className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4C6E5D] focus:border-transparent ${!editando ? 'bg-gray-50 text-gray-600' : 'bg-white'
                                            }`}
                                    />
                                </div>
                            </div>

                            {editando && (
                                <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                                    <button
                                        onClick={() => {
                                            setEditando(false);
                                            setDadosEdicao(usuario);
                                        }}
                                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={salvarPerfil}
                                        disabled={salvandoPerfil}
                                        className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${salvandoPerfil
                                                ? 'bg-gray-400 cursor-not-allowed text-white'
                                                : 'bg-[#4C6E5D] hover:bg-[#6B7F66] text-white'
                                            }`}
                                    >
                                        <Save className="w-4 h-4" />
                                        {salvandoPerfil ? 'Salvando...' : 'Salvar'}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Configurações */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-6">
                                Configurações
                            </h3>

                            <div className="space-y-4">
                                {/* Notificações */}
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                        <Bell className="w-4 h-4" />
                                        Notificações
                                    </h4>
                                    <div className="space-y-3 ml-6">
                                        <label className="flex items-center justify-between">
                                            <span className="text-sm text-gray-700">Notificações por email</span>
                                            <input
                                                type="checkbox"
                                                checked={dadosEdicao.configuracoes?.notificacoesEmail || false}
                                                onChange={() => alternarConfiguracoes('notificacoesEmail')}
                                                className="toggle-checkbox"
                                            />
                                        </label>
                                        <label className="flex items-center justify-between">
                                            <span className="text-sm text-gray-700">Notificações push</span>
                                            <input
                                                type="checkbox"
                                                checked={dadosEdicao.configuracoes?.notificacoesPush || false}
                                                onChange={() => alternarConfiguracoes('notificacoesPush')}
                                                className="toggle-checkbox"
                                            />
                                        </label>
                                    </div>
                                </div>

                                {/* Aparência */}
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                        <Palette className="w-4 h-4" />
                                        Aparência
                                    </h4>
                                    <div className="space-y-3 ml-6">
                                        <label className="flex items-center justify-between">
                                            <span className="text-sm text-gray-700">Tema escuro</span>
                                            <input
                                                type="checkbox"
                                                checked={dadosEdicao.configuracoes?.temaEscuro || false}
                                                onChange={() => alternarConfiguracoes('temaEscuro')}
                                                className="toggle-checkbox"
                                            />
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {editando && (
                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    <p className="text-sm text-gray-600">
                                        As configurações são salvas automaticamente quando você salva o perfil.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Modal Alterar Senha */}
                {mostrarAlterarSenha && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                            <div className="p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Alterar Senha
                                </h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Senha Atual
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={mostrarSenhas.atual ? 'text' : 'password'}
                                                value={senhaData.senhaAtual}
                                                onChange={(e) => setSenhaData(prev => ({ ...prev, senhaAtual: e.target.value }))}
                                                className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4C6E5D] focus:border-transparent"
                                                placeholder="Digite sua senha atual"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setMostrarSenhas(prev => ({ ...prev, atual: !prev.atual }))}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {mostrarSenhas.atual ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Nova Senha
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={mostrarSenhas.nova ? 'text' : 'password'}
                                                value={senhaData.novaSenha}
                                                onChange={(e) => setSenhaData(prev => ({ ...prev, novaSenha: e.target.value }))}
                                                className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4C6E5D] focus:border-transparent"
                                                placeholder="Digite a nova senha"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setMostrarSenhas(prev => ({ ...prev, nova: !prev.nova }))}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {mostrarSenhas.nova ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Mínimo de 8 caracteres
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Confirmar Nova Senha
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={mostrarSenhas.confirmar ? 'text' : 'password'}
                                                value={senhaData.confirmarSenha}
                                                onChange={(e) => setSenhaData(prev => ({ ...prev, confirmarSenha: e.target.value }))}
                                                className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4C6E5D] focus:border-transparent"
                                                placeholder="Confirme a nova senha"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setMostrarSenhas(prev => ({ ...prev, confirmar: !prev.confirmar }))}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {mostrarSenhas.confirmar ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        onClick={() => {
                                            setMostrarAlterarSenha(false);
                                            setSenhaData({
                                                senhaAtual: '',
                                                novaSenha: '',
                                                confirmarSenha: ''
                                            });
                                        }}
                                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={alterarSenha}
                                        disabled={alterandoSenha}
                                        className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${alterandoSenha
                                                ? 'bg-gray-400 cursor-not-allowed text-white'
                                                : 'bg-[#4C6E5D] hover:bg-[#6B7F66] text-white'
                                            }`}
                                    >
                                        <Lock className="w-4 h-4" />
                                        {alterandoSenha ? 'Alterando...' : 'Alterar Senha'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}