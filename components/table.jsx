'use client'

import clsx from 'clsx'
import { createContext, useContext, useState } from 'react'
import { Link } from './link'

const TableContext = createContext({
  bleed: false,
  dense: false,
  grid: false,
  striped: false,
})

export function Table({ bleed = false, dense = false, grid = false, striped = false, className, children, ...props }) {
  return (
    <TableContext.Provider value={{ bleed, dense, grid, striped }}>
      <div className="flow-root">
        <div {...props} className={clsx(className, '-mx-(--gutter) overflow-x-auto whitespace-normal sm:whitespace-nowrap')}>
          <div className={clsx('inline-block min-w-full align-middle', !bleed && 'sm:px-(--gutter)')}>
            <table className="min-w-full text-left text-sm/6 text-zinc-950 dark:text-white">{children}</table>
          </div>
        </div>
      </div>
    </TableContext.Provider>
  )
}

export function TableHead({ className, ...props }) {
  return <thead {...props} className={clsx(className, 'hidden text-zinc-500 dark:text-zinc-400 sm:table-header-group')} />
}

export function TableBody({ className, ...props }) {
  return <tbody {...props} className={clsx('grid grid-cols-1 gap-4 sm:table-row-group sm:gap-0', className)} />
}

const TableRowContext = createContext({
  href: undefined,
  target: undefined,
  title: undefined,
})

export function TableRow({ href, target, title, className, ...props }) {
  let { striped } = useContext(TableContext)

  return (
    <TableRowContext.Provider value={{ href, target, title }}>
      <tr
        {...props}
        className={clsx(
          className,
          // Mobile: show rows as cards; Desktop: keep table rows
          'block rounded-xl border border-zinc-950/10 bg-white/70 p-4 shadow-sm dark:border-white/10 dark:bg-white/5 sm:table-row sm:rounded-none sm:border-0 sm:p-0 sm:shadow-none',
          href &&
            'has-[[data-row-link][data-focus]]:outline-2 has-[[data-row-link][data-focus]]:-outline-offset-2 has-[[data-row-link][data-focus]]:outline-blue-500 dark:focus-within:bg-white/2.5',
          striped && 'sm:even:bg-zinc-950/2.5 dark:sm:even:bg-white/2.5',
          href && striped && 'sm:hover:bg-zinc-950/5 dark:sm:hover:bg-white/5',
          href && !striped && 'sm:hover:bg-zinc-950/2.5 dark:sm:hover:bg-white/2.5'
        )}
      />
    </TableRowContext.Provider>
  )
}

export function TableHeader({ className, ...props }) {
  let { bleed, grid } = useContext(TableContext)

  return (
    <th
      {...props}
      className={clsx(
        className,
        'border-b border-b-zinc-950/10 px-4 py-2 font-medium first:pl-(--gutter,--spacing(2)) last:pr-(--gutter,--spacing(2)) dark:border-b-white/10',
        grid && 'border-l border-l-zinc-950/5 first:border-l-0 dark:border-l-white/5',
        !bleed && 'sm:first:pl-1 sm:last:pr-1'
      )}
    />
  )
}

export function TableCell({ className, children, label, ...props }) {
  let { bleed, dense, grid, striped } = useContext(TableContext)
  let { href, target, title } = useContext(TableRowContext)
  let [cellRef, setCellRef] = useState(null)

  return (
    <td
      ref={href ? setCellRef : undefined}
      {...props}
      className={clsx(
        className,
        'relative block w-full px-0 py-2 sm:table-cell sm:px-4 sm:first:pl-(--gutter,--spacing(2)) sm:last:pr-(--gutter,--spacing(2))',
        // Keep table borders on desktop only
        (grid || !striped) && 'sm:border-b sm:border-zinc-950/5 dark:sm:border-white/5',
        grid && 'sm:border-l sm:border-l-zinc-950/5 sm:first:border-l-0 dark:sm:border-l-white/5',
        dense ? 'sm:py-2.5' : 'sm:py-4',
        !bleed && 'sm:first:pl-1 sm:last:pr-1'
      )}
    >
      {href && (
        <Link
          data-row-link
          href={href}
          target={target}
          aria-label={title}
          tabIndex={cellRef?.previousElementSibling === null ? 0 : -1}
          className="absolute inset-0 focus:outline-hidden"
        />
      )}
      {label ? <div className="mb-1 text-xs font-medium text-zinc-500 sm:hidden">{label}</div> : null}
      {children}
    </td>
  )
}
