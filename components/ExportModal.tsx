/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { 
  X, 
  FileText, 
  Download, 
  Settings, 
  Check, 
  AlertCircle,
  File,
  Table
} from 'lucide-react';
import { GuiaAbastecimento } from '@/types';
import { 
  ExportOptions, 
  FormatoExport, 
  EXPORT_DEFAULTS,
  FORMATOS_SUPORTADOS,
} from '@/types/export';
import { useExport } from '@/hooks/useExport';
import LoadingOverlay from '@/components/LoadingOverlay';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  guia: GuiaAbastecimento;
}

const FormatIcon = ({ formato }: { formato: FormatoExport }) => {
  const iconMap = {
    TXT: FileText,
    XLSX: Table,
    DOCX: FileText,
    PDF: File
  };
  
  const IconComponent = iconMap[formato] || FileText;
  return <IconComponent className="w-4 h-4" />;
};

export default function ExportModal({ isOpen, onClose, guia }: ExportModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<FormatoExport>('XLSX');
  const [exportOptions, setExportOptions] = useState<ExportOptions>(EXPORT_DEFAULTS);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const { isExporting, progress, error, exportGuia, clearError } = useExport();

  useEffect(() => {
    if (isOpen) {
      setExportOptions({
        ...EXPORT_DEFAULTS,
        formato: selectedFormat
      });
      clearError();
    }
  }, [isOpen, selectedFormat, clearError]);

  if (!isOpen) return null;

  const handleExport = async () => {
    try {
      const result = await exportGuia(guia, exportOptions, (progressData) => {
        console.log('Progresso da exportação:', progressData);
      });

      if (result.sucesso) {
        onClose();
      }
    } catch (error) {
      console.error('Erro na exportação:', error);
    }
  };

  const updateExportOptions = (updates: Partial<ExportOptions>) => {
    setExportOptions(prev => ({
      ...prev,
      ...updates
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Exportar Guia</h2>
            <p className="text-sm text-gray-600 mt-1">
              {guia.instituicaoNome} - {new Date(guia.dataInicio).toLocaleDateString('pt-BR')} a {new Date(guia.dataFim).toLocaleDateString('pt-BR')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-6">
          {/* Seleção de Formato */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Escolha o formato</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(FORMATOS_SUPORTADOS).map(([formato, info]) => (
                <button
                  key={formato}
                  onClick={() => setSelectedFormat(formato as FormatoExport)}
                  className={`p-4 border-2 rounded-lg transition-all text-center ${
                    selectedFormat === formato
                      ? 'border-[#4C6E5D] bg-[#4C6E5D]/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <FormatIcon formato={formato as FormatoExport} />
                    <span className="font-medium text-sm">{info.nome}</span>
                    {selectedFormat === formato && (
                      <Check className="w-4 h-4 text-[#4C6E5D]" />
                    )}
                  </div>
                </button>
              ))}
            </div>
            
            {selectedFormat && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  {FORMATOS_SUPORTADOS[selectedFormat].descricao}
                </p>
              </div>
            )}
          </div>

          {/* Opções Básicas */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Opções de exportação</h3>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={exportOptions.incluirCabecalho}
                  onChange={(e) => updateExportOptions({ incluirCabecalho: e.target.checked })}
                  className="rounded border-gray-300 text-[#4C6E5D] focus:ring-[#4C6E5D]"
                />
                <span className="ml-2 text-sm">Incluir cabeçalho com informações da instituição</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={exportOptions.incluirRodape}
                  onChange={(e) => updateExportOptions({ incluirRodape: e.target.checked })}
                  className="rounded border-gray-300 text-[#4C6E5D] focus:ring-[#4C6E5D]"
                />
                <span className="ml-2 text-sm">Incluir rodapé com informações adicionais</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={exportOptions.incluirAssinatura}
                  onChange={(e) => updateExportOptions({ incluirAssinatura: e.target.checked })}
                  className="rounded border-gray-300 text-[#4C6E5D] focus:ring-[#4C6E5D]"
                />
                <span className="ml-2 text-sm">Incluir campos para assinatura</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={exportOptions.agruparPorCategoria}
                  onChange={(e) => updateExportOptions({ agruparPorCategoria: e.target.checked })}
                  className="rounded border-gray-300 text-[#4C6E5D] focus:ring-[#4C6E5D]"
                />
                <span className="ml-2 text-sm">Agrupar alimentos por categoria</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={exportOptions.normalizarUnidades}
                  onChange={(e) => updateExportOptions({ normalizarUnidades: e.target.checked })}
                  className="rounded border-gray-300 text-[#4C6E5D] focus:ring-[#4C6E5D]"
                />
                <span className="ml-2 text-sm">Normalizar unidades de medida</span>
              </label>

              {exportOptions.incluirObservacoes !== undefined && (
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={exportOptions.incluirObservacoes}
                    onChange={(e) => updateExportOptions({ incluirObservacoes: e.target.checked })}
                    className="rounded border-gray-300 text-[#4C6E5D] focus:ring-[#4C6E5D]"
                  />
                  <span className="ml-2 text-sm">Incluir observações da guia</span>
                </label>
              )}
            </div>
          </div>

          {/* Configurações Avançadas */}
          <div className="mb-6">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-[#4C6E5D] hover:text-[#6B7F66] transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>Configurações avançadas</span>
              <span className="text-sm">({showAdvanced ? 'ocultar' : 'mostrar'})</span>
            </button>

            {showAdvanced && (
              <div className="mt-4 space-y-4 p-4 bg-gray-50 rounded-lg">
                {/* Formato de números */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Casas decimais
                  </label>
                  <select
                    value={exportOptions.formatoNumeros.decimais}
                    onChange={(e) => updateExportOptions({
                      formatoNumeros: {
                        ...exportOptions.formatoNumeros,
                        decimais: parseInt(e.target.value)
                      }
                    })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#4C6E5D] focus:border-[#4C6E5D]"
                  >
                    <option value={0}>0 decimais</option>
                    <option value={1}>1 decimal</option>
                    <option value={2}>2 decimais</option>
                    <option value={3}>3 decimais</option>
                  </select>
                </div>

                {/* Ordenação */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ordenação dos itens
                  </label>
                  <select
                    value={exportOptions.ordenacaoItens.tipo}
                    onChange={(e) => updateExportOptions({
                      ordenacaoItens: {
                        ...exportOptions.ordenacaoItens,
                        tipo: e.target.value as any
                      }
                    })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#4C6E5D] focus:border-[#4C6E5D]"
                  >
                    <option value="categoria">Por categoria</option>
                    <option value="alfabetica">Alfabética</option>
                    <option value="quantidade_desc">Maior quantidade</option>
                    <option value="quantidade_asc">Menor quantidade</option>
                  </select>
                </div>

                {/* Formato da unidade */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Posição da unidade
                  </label>
                  <select
                    value={exportOptions.formatoNumeros.formatoUnidade}
                    onChange={(e) => updateExportOptions({
                      formatoNumeros: {
                        ...exportOptions.formatoNumeros,
                        formatoUnidade: e.target.value as any
                      }
                    })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#4C6E5D] focus:border-[#4C6E5D]"
                  >
                    <option value="depois">Depois do número</option>
                    <option value="antes">Antes do número</option>
                    <option value="linha_separada">Linha separada</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Progresso da exportação */}
          {isExporting && progress && (
            <div className="mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-4 h-4 border-2 border-[#4C6E5D] border-t-transparent rounded-full animate-spin"></div>
                  <span className="font-medium text-blue-900">{progress.etapa}</span>
                </div>
                <p className="text-sm text-blue-700 mb-2">{progress.mensagem}</p>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-[#4C6E5D] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress.progresso}%` }}
                  ></div>
                </div>
                <p className="text-xs text-blue-600 mt-1">{progress.progresso}% concluído</p>
              </div>
            </div>
          )}

          {/* Erro */}
          {error && (
            <div className="mb-6">
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Erro na exportação</p>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Resumo */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-900 mb-2">Resumo da exportação</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Formato:</span>
                <span className="ml-2 font-medium">{FORMATOS_SUPORTADOS[selectedFormat].nome}</span>
              </div>
              <div>
                <span className="text-gray-600">Total de alimentos:</span>
                <span className="ml-2 font-medium">{guia.calculosDistribuicao.length}</span>
              </div>
              <div>
                <span className="text-gray-600">Período:</span>
                <span className="ml-2 font-medium">
                  {new Date(guia.dataInicio).toLocaleDateString('pt-BR')} - {new Date(guia.dataFim).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Agrupamento:</span>
                <span className="ml-2 font-medium">
                  {exportOptions.agruparPorCategoria ? 'Por categoria' : 'Lista única'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || !selectedFormat}
            className="px-4 py-2 bg-[#4C6E5D] text-white rounded-lg hover:bg-[#6B7F66] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Exportando...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Exportar {FORMATOS_SUPORTADOS[selectedFormat]?.nome}
              </>
            )}
          </button>
        </div>

        {/* Loading Overlay */}
        <LoadingOverlay 
          isLoading={isExporting} 
          message={progress?.mensagem || "Exportando guia..."} 
          overlay={false}
        />
      </div>
    </div>
  );
}