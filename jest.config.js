/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  testEnvironment: 'jsdom',
  setupFiles: [
    "jest-canvas-mock"
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(uuid|@rgs-core))'
  ],
  preset: 'ts-jest',
  moduleNameMapper: {
    "uuid": require.resolve('uuid'),
    "\\.(css|scss)": "babel-jest",
    '^swiper': '<rootDir>/node_modules/swiper/swiper.min.js',
    "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$": "<rootDir>/test/assetsTransformer.js"
  },
  transform: {
    "^.+\\.tsx?$": ["ts-jest", {
      allowJs: true,
      babel: true,
    }]
  },
  coveragePathIgnorePatterns: [
    "/node_modules/"
  ],
  coverageDirectory: './coverage',
  clearMocks: true,
  collectCoverage: true,
  coverageReporters: ['text-summary', 'lcov'],
};
