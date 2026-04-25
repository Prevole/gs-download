# gs-download

A TypeScript CLI application for downloading Genius Scan PDF files.

## Description

`gs-download` connects to a Genius Scan server and downloads PDF files to a local directory. It displays real-time
progress bars for each file being downloaded and logs activity to a rolling log file.

## Requirements

- Node.js >= 25

## Installation

```bash
npm install -g gs-download
```

## Usage

```bash
gs-download [options]
```

### Options

| Option | Alias | Default | Description |
|---|---|---|---|
| `--host` | `-H` | `localhost` | Host name or IP address of the Genius Scan server |
| `--port` | `-p` | `8080` | Port number of the Genius Scan server |
| `--target` | `-t` | `.` | Target directory for downloaded files |
| `--help` | `-h` | | Display help message |

### Examples

```bash
# Download from a remote server
gs-download --host 192.168.1.10 --port 8080 --target ~/Downloads/scans

# Short options (-H for host, -p for port, -t for target)
gs-download -H 192.168.1.10 -p 8080 -t ~/Downloads/scans

# Use defaults (localhost:8080, current directory)
gs-download

# Display help
gs-download --help
gs-download -h
```

## Development

### Prerequisites

- Node.js >= 25
- npm

### Setup

```bash
git clone https://github.com/Prevole/gs-download.git
cd gs-download
npm install
npm run build
```

### Local install

```bash
npm install -g .
gs-download --host <hostname> --port <port> --target <directory>
```

### Scripts

| Script | Description |
|---|---|
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run clean` | Remove `dist/` and build cache |
| `npm test` | Run unit tests |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Lint source files |
| `npm run lint:fix` | Lint and auto-fix source files |

### Project Structure

```
gs-download/
├── src/
│   ├── bin/            # CLI entry point
│   ├── managers/       # Download and progress managers
│   ├── models/         # Data models
│   ├── services/       # Download service (HTTP)
│   ├── test/           # Test utilities
│   └── utils/          # Logger
├── eslint.config.js
├── package.json
├── release.config.js   # Semantic Release configuration
├── tsconfig.json
└── vitest.config.ts
```

### Testing

The project has 100% test coverage. Run the tests with:

```bash
npm test
```

Generate a coverage report with:

```bash
npm run test:coverage
```

## License

MIT
