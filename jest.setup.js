import '@testing-library/jest-dom'

// Mock minimal Next.js router features used by components if any
jest.mock('next/navigation', () => ({
	useRouter: () => ({ push: jest.fn(), replace: jest.fn(), refresh: jest.fn() }),
	usePathname: () => '/',
}))

// Mock Next.js server helpers used by route handlers
jest.mock('next/server', () => ({
	NextResponse: {
		json: (body, init = {}) => ({
			status: init.status ?? 200,
			json: async () => body,
		}),
	},
}))

// IndexedDB mock
if (!global.indexedDB) {
	global.indexedDB = {
		open: jest.fn(),
		deleteDatabase: jest.fn(),
	}
}

// Service worker mock
if (!global.navigator) global.navigator = {}
if (!global.navigator.serviceWorker) {
	global.navigator.serviceWorker = { register: jest.fn() }
}

// Prisma client mock to avoid real DB during tests by default
jest.mock('./src/lib/prisma', () => ({
	__esModule: true,
	default: {
		day: {
			deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
			upsert: jest.fn().mockResolvedValue({}),
		},
	},
}))

