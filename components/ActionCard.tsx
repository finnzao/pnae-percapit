import { ReactNode } from 'react';

interface ActionCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  color?: string;
}

export default function ActionCard({ icon, title, description, onClick, color = '#4C6E5D' }: ActionCardProps) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-xl p-6 lg:p-8 card-shadow hover:card-shadow-hover transform transition-all duration-300 hover:-translate-y-1 text-left w-full group h-full flex flex-col"
    >
      <div 
        className="w-14 h-14 lg:w-16 lg:h-16 rounded-lg flex items-center justify-center mb-4 lg:mb-6 transition-colors"
        style={{ backgroundColor: `${color}20` }}
      >
        <div className="text-2xl lg:text-3xl transition-transform group-hover:scale-110" style={{ color }}>
          {icon}
        </div>
      </div>
      <div className="flex-1">
        <h3 className="font-medium text-base lg:text-lg text-black mb-2">{title}</h3>
        <p className="text-sm lg:text-base text-[#4C4C4C]">{description}</p>
      </div>
    </button>
  );
}