# gs-download

A TypeScript application for downloading Genius Scan PDF files.

## Description

This application allows you to download files from a Genius Scan server. It uses command-line arguments to specify the 
host, port, and target directory for downloads.

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/gs-download.git
cd gs-download

# Install dependencies
npm install

# Build the application
npm run build
```

## Usage

### Dev Only

```bash
# Install the module (dev only) globally
npm install -g .

# Using the CLI
gs-download --host <hostname> --port <port> --target <download-directory>

# Or with short options
gs-download -h <hostname> -p <port> -t <download-directory>

# OR

dist/bin/download.js --host <hostname> --port <port> --target <download-directory>

# Or with short options
dist/bin/download.js -h <hostname> -p <port> -t <download-directory>
```

### Options

- `--host`, `-h`: The hostname of the Genius Scan server
- `--port`, `-p`: The port number of the Genius Scan server
- `--target`, `-t`: The directory where files will be downloaded

## Development

This project uses TypeScript for type safety and Vitest for testing.

## Project Structure

```
gs-download/
├── src/                # TypeScript source files
│   ├── bin/            # CLI executable
│   ├── managers/       # Business logic managers
│   ├── models/         # Data models
│   ├── services/       # Service layer
│   ├── test/           # Test utilities
│   └── utils/          # Utility functions
├── eslint.config.js    # ESLint configuration
├── package.json        # Project metadata and dependencies
├── tsconfig.json       # TypeScript configuration
├── tsconfig.eslint.json # TypeScript configuration for ESLint
└── vitest.config.ts    # Vitest testing configuration
```

## Testing

The application has full unit test coverage. Run the tests with:

```bash
npm test
```

Or generate a coverage report with:

```bash
npm run test:coverage
```

## License

MIT
