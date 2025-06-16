'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Home } from 'lucide-react';

export default function Header() {
  const router = useRouter();
  const [userName, setUserName] = useState('');

  useEffect(() => {
    // Simulando recuperação do nome do usuário
    setUserName('Ana Paula');
  }, []);

  return (
    <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="container-custom">
        <div className="flex items-center justify-between py-4 lg:py-5">
          {/* Logo e Nome do Sistema */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-[#4C6E5D] rounded-lg flex items-center justify-center cursor-pointer hover:bg-[#6B7F66] transition-colors"
                 onClick={() => router.push('/')}>
              <span className="text-white font-bold text-xl lg:text-2xl">N</span>
            </div>
            <h1 className="text-xl lg:text-2xl font-semibold text-[#4C6E5D] cursor-pointer hover:text-[#6B7F66] transition-colors"
                onClick={() => router.push('/')}>
              NutriGestão
            </h1>
          </div>

          {/* Saudação e Navegação */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => router.push('/')}
              className="hidden sm:flex items-center gap-2 text-[#4C6E5D] hover:text-[#6B7F66] transition-colors"
            >
              <Home className="w-5 h-5" />
              <span className="hidden lg:inline">Início</span>
            </button>
            
            <div className="text-right">
              <p className="text-lg font-semibold text-black">Olá, {userName}</p>
              <p className="text-sm text-gray-600 hidden sm:block">Bem-vinda de volta</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}