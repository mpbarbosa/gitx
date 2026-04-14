export default {
	preset: 'ts-jest/presets/default-esm',
	testEnvironment: 'node',
	roots: ['<rootDir>/test'],
	extensionsToTreatAsEsm: ['.ts', '.tsx'],
	moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
	transform: {
		'^.+\\.(ts|tsx)$': [
			'ts-jest',
			{
				useESM: true,
				tsconfig: '<rootDir>/tsconfig.test.json'
			}
		]
	},
	moduleNameMapper: {
		'^(\\.{1,2}/.*)\\.js$': '$1'
	},
	collectCoverageFrom: [
		'<rootDir>/src/**/*.{ts,tsx}',
		'!<rootDir>/src/**/*.d.ts'
	],
	coverageThreshold: {
		global: {
			statements: 80,
			branches: 80,
			functions: 90,
			lines: 80
		}
	}
};
