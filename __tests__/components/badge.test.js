import { render, screen } from '@testing-library/react'
import { Badge } from '../../components/badge'

describe('Badge', () => {
	it('renders with default color and text', () => {
		render(<Badge>Default</Badge>)
		expect(screen.getByText('Default')).toBeInTheDocument()
	})

	it('applies color classes for emerald', () => {
		render(<Badge color="emerald">Green</Badge>)
		expect(screen.getByText('Green')).toBeInTheDocument()
	})
})

