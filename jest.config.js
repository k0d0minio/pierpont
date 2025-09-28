const nextJest = require('next/jest')

const createJestConfig = nextJest({
	dir: './',
})

const customJestConfig = {
	setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
	testEnvironment: 'jest-environment-jsdom',
	moduleNameMapper: {
		'^@/(.*)$': '<rootDir>/src/$1',
		'^components/(.*)$': '<rootDir>/components/$1',
	},
	collectCoverageFrom: [
		'components/button.jsx',
		'components/badge.jsx',
		'src/app/api/maintain-days/route.js',
	],
	coverageThreshold: {
		global: {
			branches: 50,
			functions: 70,
			lines: 70,
			statements: 70,
		},
	},
}

module.exports = createJestConfig(customJestConfig)

