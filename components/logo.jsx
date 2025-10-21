'use client';

import clsx from 'clsx';

export function Logo({ className, size = 'md', showText = true, ...props }) {
  const sizeClasses = {
    sm: 'h-8 w-8 text-lg',
    md: 'h-10 w-10 text-xl',
    lg: 'h-16 w-16 text-3xl',
    xl: 'h-20 w-20 text-4xl'
  };

  return (
    <div className={clsx('flex items-center gap-3', className)} {...props}>
      <div className={clsx(
        sizeClasses[size], 
        'flex-shrink-0 rounded-lg bg-[#00612e] text-white flex items-center justify-center font-bold'
      )}>
        P
      </div>
      {showText && (
        <span className="font-semibold text-zinc-900 dark:text-white">
          HORECA Schedule Manager
        </span>
      )}
    </div>
  );
}
