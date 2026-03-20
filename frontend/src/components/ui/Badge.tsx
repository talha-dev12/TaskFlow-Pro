// src/components/ui/Badge.tsx
// Reusable status/priority badge with colour variants

import React from 'react';
import { BadgeVariant } from '../../types';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default:  'bg-gray-100  text-gray-700  border-gray-200',
  success:  'bg-green-50  text-green-700  border-green-200',
  warning:  'bg-amber-50  text-amber-700  border-amber-200',
  danger:   'bg-red-50    text-red-700    border-red-200',
  info:     'bg-blue-50   text-blue-700   border-blue-200',
  purple:   'bg-purple-50 text-purple-700 border-purple-200',
};

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1 px-2 py-0.5
        text-xs font-medium rounded-full border
        ${variantClasses[variant]}
        ${className}
      `.trim()}
    >
      {children}
    </span>
  );
}
