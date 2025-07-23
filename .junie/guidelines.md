# TypeScript Project Guidelines

## Project Structure

This project follows a specific structure to maintain consistency and clarity:

### Source Code
- All source code files must be placed in the `src` directory
- Source files should use the `.ts` extension
- Subdirectories can be created under `src` to organize code by feature or functionality
- The main entry point is `src/index.ts`
- Source files should not contain comments
- imports statements should not use *

### Testing
- Test files must be placed in the same directory as the source files they test
- Test files must use the `.spec.ts` extension
- Test files must have the same base name as the file they are testing
  - Example: `src/utils/formatter.ts` should be tested by `src/utils/formatter.spec.ts`
- Tests use vitest as the testing framework
- Test files should not contain comments
- Test files must have given/when/then comment separators
- imports statements should not use *

### Build Output
- Compiled JavaScript files are output to the `dist` directory
- TypeScript declaration files (`.d.ts`) are also generated in the `dist` directory

### Binary Files
- Executable scripts are placed in the `src/bin` directory
- These files should also have corresponding test files in the same directory

## Development Workflow

### Building the Project
- Run `npm run build` to compile TypeScript to JavaScript
- The compiled output will be in the `dist` directory

### Running Tests
- Run `npm test` to execute all tests
- Run `npm run test:coverage` to generate test coverage reports

### Code Style
- The project uses ESLint for code style enforcement
- Run `npm run lint` to check for style issues
- Import statements should be expanded and not use wildcard (*) imports
  - Example: Use `import { Component1, Component2 } from 'module'` instead of `import * as Module from 'module'`

### Readme.md

- Project structure section must contains:
  - src folder
  - first level folders in src folder
  - project configuration files
- Project structure must not contain:
  - dist folder
  - node_modules folder
  - .junie folder
  - .idea folder
  - README.md file
