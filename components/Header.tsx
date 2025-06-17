'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Home, User } from 'lucide-react';

export default function Header() {
  const router = useRouter();
  const [userName, setUserName] = useState('');

  useEffect(() => {
    // Simulando recuperação do nome do usuário
    setUserName('Ana Paula');
  }, []);

  return (
    <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="container-custom pt-1 px-4">
        <div className="flex items-center justify-between py-4">
          {/* Logo e Nome do Sistema */}
          <div className="flex items-center gap-x-3 cursor-pointer " onClick={() => router.push('/')}>
            <div className="w-10 h-10 bg-[#4C6E5D] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">N</span>
            </div>
            <h1 className="text-xl font-semibold text-[#4C6E5D]">
              NutriGestão
            </h1>
          </div>

          {/* Navegação e Usuário */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => router.push('/')}
              className="hidden sm:flex items-center gap-2 text-[#4C6E5D] hover:text-[#6B7F66] transition-colors"
            >
              <Home className="w-5 h-5" />
              <span className="hidden lg:inline">Início</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#E7E5DF] rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-[#4C6E5D]" />
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-black">{userName}</p>
                <p className="text-xs text-gray-600 hidden sm:block">Nutricionista</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}