import React from 'react';
import { Link } from '@heroui/react';
import { Link as RouteLink } from 'react-router-dom';
import { Icon } from '@iconify/react';

interface CategorySubmenuProps {
  category: {
    title: string;
    color: string;
    apps: {
      name: string;
      icon: string;
      to: string;
    }[];
  };
}

export const CategorySubmenu: React.FC<CategorySubmenuProps> = ({ category }) => {
  // Función para mapear colores a clases de Tailwind
  const getColorClass = (color: string) => {
    // Mapa de colores estándar
    const colorMap: Record<string, string> = {
      'blue-600': 'text-blue-600',
      'blue-500': 'text-blue-500',
      'blue-400': 'text-blue-400',
      'red-600': 'text-red-600',
      'red-500': 'text-red-500',
      'red-400': 'text-red-400',
      'teal-600': 'text-teal-600',
      'teal-500': 'text-teal-500',
      'teal-400': 'text-teal-400',
      'purple-600': 'text-purple-600',
      'purple-500': 'text-purple-500',
      'purple-400': 'text-purple-400',
      'indigo-600': 'text-indigo-600',
      'indigo-500': 'text-indigo-500',
      'indigo-400': 'text-indigo-400',
      'orange-600': 'text-orange-600',
      'orange-500': 'text-orange-500',
      'orange-400': 'text-orange-400',
      'amber-600': 'text-amber-600',
      'amber-500': 'text-amber-500',
      'amber-400': 'text-amber-400',
      'green-600': 'text-green-600',
      'green-500': 'text-green-500',
      'green-400': 'text-green-400',
      'yellow-600': 'text-yellow-600',
      'yellow-500': 'text-yellow-500',
      'yellow-400': 'text-yellow-400',
      'pink-600': 'text-pink-600',
      'pink-500': 'text-pink-500',
      'pink-400': 'text-pink-400',
      'gray-600': 'text-gray-600',
      'gray-500': 'text-gray-500',
      'gray-400': 'text-gray-400',
      'slate-600': 'text-slate-600',
      'slate-500': 'text-slate-500',
      'slate-400': 'text-slate-400',
      'zinc-600': 'text-zinc-600',
      'zinc-500': 'text-zinc-500',
      'zinc-400': 'text-zinc-400',
      'neutral-600': 'text-neutral-600',
      'neutral-500': 'text-neutral-500',
      'neutral-400': 'text-neutral-400',
      'stone-600': 'text-stone-600',
      'stone-500': 'text-stone-500',
      'stone-400': 'text-stone-400',
      'sky-600': 'text-sky-600',
      'sky-500': 'text-sky-500',
      'sky-400': 'text-sky-400',
      'cyan-600': 'text-cyan-600',
      'cyan-500': 'text-cyan-500',
      'cyan-400': 'text-cyan-400',
      'emerald-600': 'text-emerald-600',
      'emerald-500': 'text-emerald-500',
      'emerald-400': 'text-emerald-400',
      'lime-600': 'text-lime-600',
      'lime-500': 'text-lime-500',
      'lime-400': 'text-lime-400',
      'fuchsia-600': 'text-fuchsia-600',
      'fuchsia-500': 'text-fuchsia-500',
      'fuchsia-400': 'text-fuchsia-400',
      'rose-600': 'text-rose-600',
      'rose-500': 'text-rose-500',
      'rose-400': 'text-rose-400',
      'violet-600': 'text-violet-600',
      'violet-500': 'text-violet-500',
      'violet-400': 'text-violet-400'
    };
    
    // Si el color existe en el mapa, devolver la clase correspondiente
    if (colorMap[color]) {
      return colorMap[color];
    }
    
    // Si el color es un valor hexadecimal o RGB, usar style inline
    if (color.startsWith('#') || color.startsWith('rgb')) {
      return `text-primary`; // Usar una clase base y aplicar el color con style
    }
    
    // Valor por defecto
    return 'text-primary';
  };
  
  // Función para obtener el estilo inline si es necesario
  const getColorStyle = (color: string) => {
    if (color.startsWith('#') || color.startsWith('rgb')) {
      return { color };
    }
    return {};
  };

  return (
    <div>
      <h3 
        className={`${getColorClass(category.color)} font-medium mb-3`}
        style={getColorStyle(category.color)}
      >
        {category.title}
      </h3>
      <ul className="space-y-2">
        {category.apps.map((app, index) => (
          <li key={index}>
            {app.to.startsWith('http') ? (
              <a 
                href={app.to} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
              >
                <Icon icon={app.icon} width={16} height={16} />
                <span>{app.name}</span>
              </a>
            ) : (
              <Link 
                as={RouteLink} 
                to={app.to}
                className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
              >
                <Icon icon={app.icon} width={16} height={16} />
                <span>{app.name}</span>
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};