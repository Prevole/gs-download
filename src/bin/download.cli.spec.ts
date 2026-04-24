import { vi } from 'vitest';

vi.mock('../utils/logger.js', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

vi.mock('../managers/download-manager.js', () => ({
  default: vi.fn().mockImplementation(function() {
    return { downloadFilesFromJson: vi.fn().mockResolvedValue([]) };
  })
}));

vi.mock('../managers/progress-manager.js');
vi.mock('../services/download.service.js');
vi.mock('command-line-args', () => ({
  default: vi.fn().mockReturnValue({ host: 'localhost', port: 8080, target: '.', help: false })
}));

describe('download CLI entry point', () => {
  let originalArgv: string[];
  let originalExit: typeof process.exit;

  beforeEach(() => {
    originalArgv = process.argv;
    originalExit = process.exit;
    process.exit = vi.fn() as unknown as typeof process.exit;
    vi.resetModules();
  });

  afterEach(() => {
    process.argv = originalArgv;
    process.exit = originalExit;
  });

  it('should call executeDownload and exit 0 on success when invoked as CLI', async () => {
    // given - simulate being invoked as the gs-download binary
    process.argv = ['node', '/usr/local/bin/gs-download'];

    // when
    await import('./download.js');
    // wait for async operations to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    // then
    expect(process.exit).toHaveBeenCalledWith(0);
  });

  it('should call process.exit(1) when executeDownload returns failure', async () => {
    // given
    process.argv = ['node', '/usr/local/bin/gs-download'];

    vi.doMock('../managers/download-manager.js', () => ({
      default: vi.fn().mockImplementation(function() {
        return {
          downloadFilesFromJson: vi.fn().mockRejectedValue(new Error('download error'))
        };
      })
    }));

    // when
    await import('./download.js');
    await new Promise(resolve => setTimeout(resolve, 100));

    // then
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});
