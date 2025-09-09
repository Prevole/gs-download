import { vi } from 'vitest';
import 'reflect-metadata';

import { container } from '../config/container.js';
import { TYPES } from '../config/types.js';
import DownloadManager from '../managers/download-manager.js';
import { createMock } from "../test/test-utils.js";
import logger from '../utils/logger.js';
import { optionDefinitions, displayHelp, executeDownload } from './download.js';

// eslint-disable-next-line import/no-namespace
import * as downloadModule from './download.js';

vi.mock('../utils/logger.js', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

vi.mock('../config/container.js', () => ({
  container: {
    get: vi.fn()
  }
}));

const originalConsoleLog = console.log;
console.log = vi.fn();

describe('download', () => {
  let mockDownloadManager: DownloadManager;

  beforeEach(() => {
    vi.clearAllMocks();

    mockDownloadManager = createMock<DownloadManager>({
      downloadFilesFromJson: vi.fn()
    });

    vi.mocked(container.get).mockImplementation((serviceIdentifier) => {
      if (serviceIdentifier === TYPES.DownloadManager) {
        return mockDownloadManager;
      }
      return {};
    });

    vi.spyOn(downloadModule, 'displayHelp');
  });

  afterAll(() => {
    console.log = originalConsoleLog;
  });

  describe('optionDefinitions', () => {
    it('should define the correct command line options', () => {
      // given/when
      const options = optionDefinitions;

      // then
      expect(options).toHaveLength(4);

      const hostOption = options.find(opt => opt.name === 'host');
      expect(hostOption).toBeDefined();
      expect(hostOption?.alias).toBe('h');
      expect(hostOption?.type).toBe(String);
      expect(hostOption?.defaultValue).toBe('localhost');

      const portOption = options.find(opt => opt.name === 'port');
      expect(portOption).toBeDefined();
      expect(portOption?.alias).toBe('p');
      expect(portOption?.type).toBe(Number);
      expect(portOption?.defaultValue).toBe(8080);

      const targetOption = options.find(opt => opt.name === 'target');
      expect(targetOption).toBeDefined();
      expect(targetOption?.alias).toBe('t');
      expect(targetOption?.type).toBe(String);
      expect(targetOption?.defaultValue).toBe('.');

      const helpOption = options.find(opt => opt.name === 'help');
      expect(helpOption).toBeDefined();
      expect(helpOption?.alias).toBe('?');
      expect(helpOption?.type).toBe(Boolean);
      expect(helpOption?.defaultValue).toBe(false);
    });
  });

  describe('displayHelp', () => {
    it('should display help information', () => {
      // given/when
      const result = displayHelp();

      // then
      expect(result).toBe(true);
      expect(console.log).toHaveBeenCalledWith('Usage: gs-download [options]');
      expect(console.log).toHaveBeenCalledWith('Options:');

      optionDefinitions.forEach(option => {
        expect(console.log).toHaveBeenCalledWith(
          expect.stringContaining(`--${option.name}, -${option.alias}`)
        );
        expect(console.log).toHaveBeenCalledWith(
          expect.stringContaining(option.description)
        );
        expect(console.log).toHaveBeenCalledWith(
          expect.stringContaining(`(default: ${option.defaultValue})`)
        );
      });
    });
  });

  describe('executeDownload', () => {
    it('should display help and return true when help option is true', async () => {
      // given
      const options = { help: true };

      // when
      const result = await executeDownload(options);

      // then
      expect(result).toBe(true);
      expect(console.log).toHaveBeenCalledWith('Usage: gs-download [options]');
      expect(container.get).not.toHaveBeenCalled();
    });

    it('should download files successfully', async () => {
      // given
      const options = {
        host: 'example.com',
        port: 9000,
        target: '/downloads'
      };

      const mockFiles = ['/path/file1.pdf', '/path/file2.pdf'];
      mockDownloadManager.downloadFilesFromJson = vi.fn().mockResolvedValue(mockFiles);

      // when
      const result = await executeDownload(options);

      // then
      expect(result).toBe(true);

      expect(logger.info).toHaveBeenCalledWith('Connecting to example.com:9000');
      expect(logger.info).toHaveBeenCalledWith('Target directory: /downloads');

      expect(mockDownloadManager.downloadFilesFromJson).toHaveBeenCalledWith(
        'http://example.com:9000/files',
        'http://example.com:9000',
        '/downloads'
      );

      expect(logger.info).toHaveBeenCalledWith('Download completed. 2 files downloaded.');
    });

    it('should handle errors during download', async () => {
      // given
      const options = {
        host: 'example.com',
        port: 9000,
        target: '/downloads'
      };

      const error = new Error('Download failed');
      mockDownloadManager.downloadFilesFromJson = vi.fn().mockRejectedValue(error);

      // when
      const result = await executeDownload(options);

      // then
      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith('Download failed: Download failed');
    });

    it('should handle non-Error objects thrown during download', async () => {
      // given
      const options = {
        host: 'example.com',
        port: 9000,
        target: '/downloads'
      };

      mockDownloadManager.downloadFilesFromJson = vi.fn().mockRejectedValue('String error');

      // when
      const result = await executeDownload(options);

      // then
      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith('Download failed: String error');
    });
  });
});
