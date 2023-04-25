module.exports = {
    setupFiles: ['dotenv/config'],
    testEnvironment: 'jsdom',
    preset: 'ts-jest/presets/js-with-ts-esm',
    moduleNameMapper: {
        '^.+\\.svg$': 'jest-svg-transformer',
    },
    transform: {
        '^.+\\.(ts|tsx|js|jsx)$': [
            'ts-jest',
            {
                diagnostics: true,
            },
        ],
    },
    setupFilesAfterEnv: ['./jest.setup.js'],
};
