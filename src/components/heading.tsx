import clsx from 'clsx'
import { ReactNode } from 'react'
import type React from 'react'

type HeadingProps = {
  className?: string;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  children?: ReactNode;
  [key: string]: any;
}

export function Heading({ className, level = 1, ...props }: HeadingProps) {
  let Element = `h${level}` as keyof React.JSX.IntrinsicElements

  return (
    <Element
      {...props}
      className={clsx(className, 'text-2xl/8 font-semibold text-zinc-950 sm:text-xl/8 dark:text-white')}
    />
  )
}

type SubheadingProps = {
  className?: string;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  children?: ReactNode;
  [key: string]: any;
}

export function Subheading({ className, level = 2, ...props }: SubheadingProps) {
  let Element = `h${level}` as keyof React.JSX.IntrinsicElements

  return (
    <Element
      {...props}
      className={clsx(className, 'text-base/7 font-semibold text-zinc-950 sm:text-sm/6 dark:text-white')}
    />
  )
}
