'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Home, User, Menu, X } from 'lucide-react';

export default function Header() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [menuAberto, setMenuAberto] = useState(false);

  useEffect(() => {
    // Simulando recuperação do nome do usuário
    setUserName('Ana Paula');
  }, []);

  return (
    <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="container-custom px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          {/* Logo e Nome do Sistema */}
          <div className="flex items-center gap-x-3 cursor-pointer" onClick={() => router.push('/')}>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#4C6E5D] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg sm:text-xl">N</span>
            </div>
            <h1 className="text-lg sm:text-xl font-semibold text-[#4C6E5D]">
              NutriGestão
            </h1>
          </div>

          {/* Navegação Desktop */}
          <div className="hidden md:flex items-center gap-6">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 text-[#4C6E5D] hover:text-[#6B7F66] transition-colors"
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
                <p className="text-xs text-gray-600 hidden lg:block">Nutricionista</p>
              </div>
            </div>
          </div>

          {/* Menu Mobile/Tablet */}
          <div className="md:hidden">
            <button
              onClick={() => setMenuAberto(!menuAberto)}
              className="p-2 text-[#4C6E5D] hover:text-[#6B7F66] transition-colors"
            >
              {menuAberto ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Menu Mobile Expandido */}
        {menuAberto && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <div className="space-y-4">
              <button
                onClick={() => {
                  router.push('/');
                  setMenuAberto(false);
                }}
                className="flex items-center gap-3 text-[#4C6E5D] hover:text-[#6B7F66] transition-colors w-full"
              >
                <Home className="w-5 h-5" />
                <span>Início</span>
              </button>

              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <div className="w-10 h-10 bg-[#E7E5DF] rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-[#4C6E5D]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-black">{userName}</p>
                  <p className="text-xs text-gray-600">Nutricionista</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}