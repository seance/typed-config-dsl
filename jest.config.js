// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

module.exports = {

  // An array of file extensions your modules use
  moduleFileExtensions: [
    "js",
    "ts",
  ],

  // The test environment that will be used for testing
  testEnvironment: "node",

  // The regexp pattern or array of patterns that Jest uses to detect test files
  testRegex: [
    "test/.*\\.spec\\.ts$",
  ],

  // A map from regular expressions to paths to transformers
  transform: {
    "\\.ts$": "ts-jest",
  },

  // Indicates whether each individual test should be reported during the run
  verbose: false,
};
