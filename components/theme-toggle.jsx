'use client'

import { useEffect, useState } from 'react'
import { Switch } from './switch.jsx'
import clsx from 'clsx'

// Persisted key for theme preference
const STORAGE_KEY = 'theme'

function getInitialIsDark() {
	if (typeof window === 'undefined') return false
	const stored = window.localStorage.getItem(STORAGE_KEY)
	if (stored === 'dark') return true
	if (stored === 'light') return false
	return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
}

export default function ThemeToggle({ className }) {
	const [isDark, setIsDark] = useState(false)

	useEffect(() => {
		setIsDark(getInitialIsDark())
	}, [])

	useEffect(() => {
		if (typeof document === 'undefined') return
		const root = document.documentElement
		if (isDark) {
			root.classList.add('dark')
			root.classList.remove('light')
			window.localStorage.setItem(STORAGE_KEY, 'dark')
		} else {
			root.classList.add('light')
			root.classList.remove('dark')
			window.localStorage.setItem(STORAGE_KEY, 'light')
		}
	}, [isDark])

	return (
		<div className={clsx('flex items-center gap-2', className)}>
			<span className="hidden sm:inline text-xs text-zinc-500 dark:text-zinc-400">Theme</span>
			<Switch
				color={isDark ? 'dark/white' : 'zinc'}
				aria-label="Toggle dark mode"
				checked={isDark}
				onChange={setIsDark}
			/>
		</div>
	)
}

