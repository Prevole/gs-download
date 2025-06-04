# gs-download

A TypeScript application for downloading Genius Scan PDF files.

## Description

This application allows you to download files from a Genius Scan server. It uses command-line arguments to specify the host, port, and target directory for downloads.

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

```bash
# Using the CLI
gs-download --host <hostname> --port <port> --target <download-directory>

# Or with short options
gs-download -h <hostname> -p <port> -t <download-directory>
```

### Options

- `--host`, `-h`: The hostname of the Genius Scan server
- `--port`, `-p`: The port number of the Genius Scan server
- `--target`, `-t`: The directory where files will be downloaded

## Development

This project uses TypeScript for type safety and Jest for testing.

### Available Scripts

- `npm run build`: Compiles TypeScript to JavaScript
- `npm run dev`: Runs the application using ts-node (no compilation needed)
- `npm test`: Runs the test suite
- `npm run test:coverage`: Runs the test suite with coverage report
- `npm run lint`: Lints the codebase

## Project Structure

```
gs-download/
├── dist/               # Compiled JavaScript files
├── src/                # TypeScript source files
│   ├── bin/            # CLI executable
│   ├── __tests__/      # Test files
│   └── index.ts        # Main application code
├── package.json        # Project metadata and dependencies
├── tsconfig.json       # TypeScript configuration
└── README.md           # This file
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
