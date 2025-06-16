'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import ActionCard from '@/components/ActionCard';
import AccordionItem from '@/components/AccordionItem';
import { 
  Utensils, 
  Plus, 
  FileText, 
  BarChart3,
  Search,
  Calculator,
  Building2
} from 'lucide-react';
import { converterListaParaMapaDeAlimentos } from './api/utils/alimentosUtils';
import { Alimento, Etapa } from '@/types';

interface AlimentoPorEtapa {
  creche: string[];
  pre: string[];
  fundamental: string[];
  medio: string[];
}

export default function HomePage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [alimentosPorEtapa, setAlimentosPorEtapa] = useState<AlimentoPorEtapa>({
    creche: [],
    pre: [],
    fundamental: [],
    medio: []
  });

  useEffect(() => {
    // Organizar alimentos por etapa
    const alimentosMap = converterListaParaMapaDeAlimentos();
    const organizados: AlimentoPorEtapa = {
      creche: [],
      pre: [],
      fundamental: [],
      medio: []
    };

    Object.values(alimentosMap).forEach((alimento: Alimento) => {
      const etapas: Etapa[] = ['creche', 'pre', 'fundamental', 'medio'];
      etapas.forEach(etapa => {
        if (alimento.perCapita[etapa].status === 'disponivel') {
          organizados[etapa].push(alimento.nome);
        }
      });
    });

    // Ordenar alfabeticamente
    (Object.keys(organizados) as Etapa[]).forEach(etapa => {
      organizados[etapa].sort();
    });

    setAlimentosPorEtapa(organizados);
  }, []);

  const actionCards = [
    {
      icon: <Utensils />,
      title: 'Criar cardápio',
      description: 'Planeje as refeições do dia',
      onClick: () => router.push('/cardapio'),
      color: '#4C6E5D'
    },
    {
      icon: <Plus />,
      title: 'Novo alimento',
      description: 'Cadastre ingredientes',
      onClick: () => router.push('/cadastrarAlimento'),
      color: '#6B7F66'
    },
    {
      icon: <FileText />,
      title: 'Gerar guia',
      description: 'Guia de abastecimento',
      onClick: () => router.push('/guia-abastecimento'),
      color: '#C8D5B9'
    },
    {
      icon: <BarChart3 />,
      title: 'Relatórios',
      description: 'Dados consolidados',
      onClick: () => router.push('/relatorios'),
      color: '#4C6E5D'
    }
  ];

  const filteredAlimentos = (alimentos: string[]) => {
    if (!searchTerm) return alimentos;
    return alimentos.filter(alimento => 
      alimento.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const etapasInfo = [
    { key: 'creche' as Etapa, title: 'Creche', description: 'Crianças até 3 anos' },
    { key: 'pre' as Etapa, title: 'Pré-escola', description: '4 a 5 anos' },
    { key: 'fundamental' as Etapa, title: 'Ensino Fundamental', description: '6 a 14 anos' },
    { key: 'medio' as Etapa, title: 'Ensino Médio', description: '15 a 17 anos' }
  ];

  return (
    <div className="full-height-layout">
      <Header />
      
      <main className="main-content">
        <div className="container-custom flex-1 py-6 lg:py-8">
          {/* Seção de Ações Rápidas */}
          <section className="mb-8 lg:mb-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {actionCards.map((card, index) => (
                <ActionCard key={index} {...card} />
              ))}
            </div>
          </section>

          {/* Grid de 2 colunas em telas grandes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Coluna Esquerda - Calculadora e Links Rápidos */}
            <div className="space-y-6 lg:space-y-8">
              {/* Botão de Cálculo Per Capita */}
              <div className="bg-white rounded-xl p-6 lg:p-8 card-shadow h-full">
                <div className="flex flex-col h-full">
                  <div className="flex-1">
                    <h2 className="text-xl lg:text-2xl font-semibold text-[#4C6E5D] mb-3">
                      Calculadora Per Capita
                    </h2>
                    <p className="text-[#4C4C4C] mb-6">
                      Calcule rapidamente as quantidades necessárias para suas refeições
                    </p>
                  </div>
                  <button
                    onClick={() => router.push('/calcular')}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    <Calculator className="w-5 h-5" />
                    Calcular Agora
                  </button>
                </div>
              </div>

              {/* Card de Instituições */}
              <div className="bg-white rounded-xl p-6 lg:p-8 card-shadow">
                <div className="flex flex-col h-full">
                  <div className="flex-1">
                    <h2 className="text-xl lg:text-2xl font-semibold text-[#4C6E5D] mb-3">
                      Gerenciar Instituições
                    </h2>
                    <p className="text-[#4C4C4C] mb-6">
                      Cadastre e gerencie as escolas e creches atendidas
                    </p>
                  </div>
                  <button
                    onClick={() => router.push('/instituicoes')}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                    style={{ backgroundColor: '#6B7F66' }}
                  >
                    <Building2 className="w-5 h-5" />
                    Acessar Instituições
                  </button>
                </div>
              </div>
            </div>

            {/* Coluna Direita - Alimentos por Categoria */}
            <div className="bg-white rounded-xl card-shadow h-fit">
              <div className="p-6 lg:p-8 border-b border-gray-200">
                <h2 className="text-xl lg:text-2xl font-semibold text-black mb-4">
                  Alimentos por Categoria Educacional
                </h2>
                
                {/* Barra de pesquisa */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Pesquisar alimentos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4C6E5D] focus:border-transparent"
                  />
                </div>
              </div>

              <div className="divide-y divide-gray-200">
                {etapasInfo.map((etapa) => (
                  <AccordionItem 
                    key={etapa.key} 
                    title={`${etapa.title} (${filteredAlimentos(alimentosPorEtapa[etapa.key]).length} alimentos)`}
                    defaultOpen={etapa.key === 'fundamental'}
                  >
                    <p className="text-sm text-[#4C4C4C] mb-3">{etapa.description}</p>
                    {filteredAlimentos(alimentosPorEtapa[etapa.key]).length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                        {filteredAlimentos(alimentosPorEtapa[etapa.key]).map((alimento, index) => (
                          <div
                            key={index}
                            className="px-3 py-2 bg-gray-50 rounded-lg text-sm text-[#4C4C4C] hover:bg-gray-100 cursor-pointer transition-colors"
                          >
                            {alimento}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 italic">
                        {searchTerm ? 'Nenhum alimento encontrado' : 'Nenhum alimento cadastrado para esta etapa'}
                      </p>
                    )}
                  </AccordionItem>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}