import { render, screen } from '@testing-library/react'
import React from 'react'
import { Button } from '../../components/button'

describe('Button', () => {
	it('renders children', () => {
		render(<Button>Click me</Button>)
		expect(screen.getByText('Click me')).toBeInTheDocument()
	})

	it('renders as link when href provided', () => {
		render(
			<Button href="/test" outline>
				Go
			</Button>
		)
		expect(screen.getByRole('link', { name: 'Go' })).toBeInTheDocument()
	})

	it('supports plain variant', () => {
		render(<Button plain>Plain</Button>)
		expect(screen.getByText('Plain')).toBeInTheDocument()
	})
})

