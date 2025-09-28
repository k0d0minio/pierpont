require('@testing-library/jest-dom')

// Keep setup minimal; route tests mock prisma locally

// Basic IndexedDB mock used by some environments
global.indexedDB = global.indexedDB || {
	open: jest.fn(),
	deleteDatabase: jest.fn(),
}

// Service worker mock for PWA registration
global.navigator = global.navigator || {}
global.navigator.serviceWorker = global.navigator.serviceWorker || {
	register: jest.fn(),
}

