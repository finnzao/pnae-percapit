'use client';

import { useState } from 'react';
import {
    Shield,
    Download,
    Trash2,
    AlertTriangle,
    Settings,
    Clock,
    Database,
    Key
} from 'lucide-react';

interface ConfiguracoesAvancadasProps {
    onExportarDados: () => void;
    onExcluirConta: () => void;
    onLimparCache: () => void;
    carregando?: boolean;
}

interface ConfiguracaoSeguranca {
    autenticacaoDoisFatores: boolean;
    sessaoUnica: boolean;
    logoutAutomatico: number; // em minutos
    tentativasLogin: number;
}

export default function ConfiguracoesAvancadas({
    onExportarDados,
    onExcluirConta,
    onLimparCache,
    carregando = false
}: ConfiguracoesAvancadasProps) {
    const [configuracoes, setConfiguracoes] = useState<ConfiguracaoSeguranca>({
        autenticacaoDoisFatores: false,
        sessaoUnica: true,
        logoutAutomatico: 480, // 8 horas
        tentativasLogin: 5
    });

    const [mostrarConfirmacaoExclusao, setMostrarConfirmacaoExclusao] = useState(false);
    const [confirmacaoTexto, setConfirmacaoTexto] = useState('');

    const alterarConfiguracao = <K extends keyof ConfiguracaoSeguranca>(
        chave: K,
        valor: ConfiguracaoSeguranca[K]
    ) => {
        setConfiguracoes(prev => ({
            ...prev,
            [chave]: valor
        }));
    };


    const opcoesLogout = [
        { valor: 30, label: '30 minutos' },
        { valor: 60, label: '1 hora' },
        { valor: 120, label: '2 horas' },
        { valor: 240, label: '4 horas' },
        { valor: 480, label: '8 horas' },
        { valor: 720, label: '12 horas' },
        { valor: 1440, label: '24 horas' }
    ];

    return (
        <div className="space-y-6">
            {/* Segurança */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Segurança
                </h3>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                            <h4 className="font-medium text-gray-900">Autenticação de Dois Fatores</h4>
                            <p className="text-sm text-gray-600">
                                Adicione uma camada extra de segurança à sua conta
                            </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={configuracoes.autenticacaoDoisFatores}
                                onChange={(e) => alterarConfiguracao('autenticacaoDoisFatores', e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#4C6E5D]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4C6E5D]"></div>
                        </label>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                            <h4 className="font-medium text-gray-900">Sessão Única</h4>
                            <p className="text-sm text-gray-600">
                                Permitir login em apenas um dispositivo por vez
                            </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={configuracoes.sessaoUnica}
                                onChange={(e) => alterarConfiguracao('sessaoUnica', e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#4C6E5D]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4C6E5D]"></div>
                        </label>
                    </div>

                    <div className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-3">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <h4 className="font-medium text-gray-900">Logout Automático</h4>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                            Tempo de inatividade antes do logout automático
                        </p>
                        <select
                            value={configuracoes.logoutAutomatico}
                            onChange={(e) => alterarConfiguracao('logoutAutomatico', Number(e.target.value))}
                            className="w-full md:w-auto px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4C6E5D] focus:border-transparent"
                        >
                            {opcoesLogout.map(opcao => (
                                <option key={opcao.valor} value={opcao.valor}>
                                    {opcao.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-3">
                            <Key className="w-4 h-4 text-gray-500" />
                            <h4 className="font-medium text-gray-900">Tentativas de Login</h4>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                            Número máximo de tentativas antes do bloqueio temporário
                        </p>
                        <select
                            value={configuracoes.tentativasLogin}
                            onChange={(e) => alterarConfiguracao('tentativasLogin', Number(e.target.value))}
                            className="w-full md:w-auto px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4C6E5D] focus:border-transparent"
                        >
                            <option value={3}>3 tentativas</option>
                            <option value={5}>5 tentativas</option>
                            <option value={10}>10 tentativas</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Dados e Privacidade */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Dados e Privacidade
                </h3>

                <div className="space-y-4">
                    <div className="p-4 border border-gray-200 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">Exportar Dados</h4>
                        <p className="text-sm text-gray-600 mb-4">
                            Baixe uma cópia de todos os seus dados em formato JSON
                        </p>
                        <button
                            onClick={onExportarDados}
                            disabled={carregando}
                            className="flex items-center gap-2 px-4 py-2 bg-[#4C6E5D] text-white rounded-lg hover:bg-[#6B7F66] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Download className="w-4 h-4" />
                            {carregando ? 'Preparando...' : 'Exportar Dados'}
                        </button>
                    </div>

                    <div className="p-4 border border-gray-200 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">Limpar Cache</h4>
                        <p className="text-sm text-gray-600 mb-4">
                            Remove dados temporários armazenados localmente
                        </p>
                        <button
                            onClick={onLimparCache}
                            disabled={carregando}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Settings className="w-4 h-4" />
                            {carregando ? 'Limpando...' : 'Limpar Cache'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Zona de Perigo */}
            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-red-500">
                <h3 className="text-lg font-semibold text-red-600 mb-6 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Zona de Perigo
                </h3>

                <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                    <h4 className="font-medium text-red-900 mb-2">Excluir Conta</h4>
                    <p className="text-sm text-red-700 mb-4">
                        Esta ação é irreversível. Todos os seus dados serão permanentemente removidos.
                    </p>
                    <button
                        onClick={() => setMostrarConfirmacaoExclusao(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                        Excluir Conta
                    </button>
                </div>
            </div>

            {/* Modal de Confirmação de Exclusão */}
            {mostrarConfirmacaoExclusao && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                    <AlertTriangle className="w-5 h-5 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Confirmar Exclusão de Conta
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        Esta ação não pode ser desfeita
                                    </p>
                                </div>
                            </div>

                            <div className="mb-4">
                                <p className="text-sm text-gray-700 mb-3">
                                    Para confirmar, digite <strong>EXCLUIR</strong> no campo abaixo:
                                </p>
                                <input
                                    type="text"
                                    value={confirmacaoTexto}
                                    onChange={(e) => setConfirmacaoTexto(e.target.value)}
                                    placeholder="Digite EXCLUIR"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                />
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => {
                                        setMostrarConfirmacaoExclusao(false);
                                        setConfirmacaoTexto('');
                                    }}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => {
                                        if (confirmacaoTexto === 'EXCLUIR') {
                                            onExcluirConta();
                                            setMostrarConfirmacaoExclusao(false);
                                            setConfirmacaoTexto('');
                                        }
                                    }}
                                    disabled={confirmacaoTexto !== 'EXCLUIR'}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Excluir Conta
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}