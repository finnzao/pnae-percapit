'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface AccordionItemProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export default function AccordionItem({ title, children, defaultOpen = false }: AccordionItemProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-200 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 lg:px-8 py-5 lg:py-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <h3 className="font-medium text-base lg:text-lg text-black">{title}</h3>
        <ChevronDown 
          className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <div className={`accordion-content ${isOpen ? 'open' : ''}`}>
        <div className="px-6 lg:px-8 pb-5 lg:pb-6">
          {children}
        </div>
      </div>
    </div>
  );
}