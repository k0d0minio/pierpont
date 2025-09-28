const nextJest = require('next/jest')

const createJestConfig = nextJest({
	dir: './',
})

/** @type {import('jest').Config} */
const customJestConfig = {
	testEnvironment: 'jest-environment-jsdom',
	setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
	moduleNameMapper: {
		'^@/(.*)$': '<rootDir>/src/$1',
	},
	collectCoverageFrom: [
		'components/button.jsx',
		'src/app/api/maintain-days/route.js',
	],
	coverageThreshold: {
		global: {
			branches: 70,
			functions: 70,
			lines: 70,
			statements: 70,
		},
	},
}

module.exports = createJestConfig(customJestConfig)

