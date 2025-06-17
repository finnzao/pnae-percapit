'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { 
  Utensils, 
  Calculator,
  Building2,
  Search,
  PlusSquare,
  FileText,
  Coffee,
  BarChart
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  const mainActions = [
    {
      title: 'Calculadora',
      description: 'Calcule quantidades necessárias para suas refeições',
      icon: <Calculator className="h-6 w-6" />,
      onClick: () => router.push('/calcular'),
      color: '#4C6E5D'
    },
    {
      title: 'Cardápios',
      description: 'Crie e gerencie cardápios completos',
      icon: <Utensils className="h-6 w-6" />,
      onClick: () => router.push('/cardapio'),
      color: '#6B7F66'
    },
    {
      title: 'Instituições',
      description: 'Gerencie escolas e creches',
      icon: <Building2 className="h-6 w-6" />,
      onClick: () => router.push('/instituicoes'),
      color: '#4C6E5D'
    }
  ];

  const secondaryActions = [
    {
      title: 'Novo Alimento',
      icon: <PlusSquare className="h-5 w-5" />,
      onClick: () => router.push('/cadastrarAlimento')
    },
    {
      title: 'Guia de Abastecimento',
      icon: <FileText className="h-5 w-5" />,
      onClick: () => router.push('/guia-abastecimento')
    },
    {
      title: 'Refeições',
      icon: <Coffee className="h-5 w-5" />,
      onClick: () => router.push('/refeicoes')
    },
    {
      title: 'Relatórios',
      icon: <BarChart className="h-5 w-5" />,
      onClick: () => router.push('/relatorios')
    }
  ];

  return (
    <div className="full-height-layout bg-background">
      <Header />
      
      <main className="main-content">
        <div className="container-custom py-8 px-4 md:px-6">
          {/* Cabeçalho */}
          <div className="text-center mb-12 max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold text-primary mb-4">Sistema de Gestão Nutricional</h1>
            <p className="text-text-secondary text-lg">
              Simplifique o planejamento e distribuição de alimentos para instituições educacionais
            </p>
          </div>
          
          {/* Barra de pesquisa */}
          <div className="relative max-w-3xl mx-auto mb-12">
            <div className="relative flex items-center">
              <Search className="absolute left-4 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Pesquisar por alimentos, instituições ou cardápios..."
                className="w-full bg-white py-4 pl-12 pr-4 rounded-full shadow-sm border border-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Ações principais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-5xl mx-auto">
            {mainActions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className="flex flex-col items-center justify-center bg-white rounded-xl p-8 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1 text-center h-64"
              >
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${action.color}20` }}
                >
                  <div style={{ color: action.color }}>
                    {action.icon}
                  </div>
                </div>
                <h2 className="text-xl font-semibold mb-2">{action.title}</h2>
                <p className="text-text-secondary">{action.description}</p>
              </button>
            ))}
          </div>

          {/* Ações secundárias */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {secondaryActions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className="flex items-center gap-3 bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all"
              >
                <div className="text-primary">
                  {action.icon}
                </div>
                <span className="font-medium">{action.title}</span>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}