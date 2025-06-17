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
      className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transform transition-all duration-300 hover:-translate-y-1 text-left w-full group h-full flex flex-col"
    >
      <div 
        className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-colors"
        style={{ backgroundColor: `${color}15` }}
      >
        <div className="text-xl transition-transform group-hover:scale-110" style={{ color }}>
          {icon}
        </div>
      </div>
      <div className="flex-1">
        <h3 className="font-medium text-lg mb-2">{title}</h3>
        <p className="text-sm text-[#4C4C4C]">{description}</p>
      </div>
    </button>
  );
}