import { vi } from 'vitest';

import DownloadManager from '../managers/download-manager.js';
import FileInfo from '../models/file-info.model.js';
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

// Mock all dependencies so we can instantiate without type casting
vi.mock('../managers/progress-manager.js', () => ({
  default: vi.fn().mockImplementation(() => ({
    create: vi.fn(),
    update: vi.fn(),
    done: vi.fn(),
    stop: vi.fn()
  }))
}));

vi.mock('../services/download.service.js', () => ({
  default: vi.fn().mockImplementation(() => ({
    retrieveFileList: vi.fn(),
    downloadFile: vi.fn()
  }))
}));

vi.mock('../managers/download-manager.js', () => ({
  default: vi.fn().mockImplementation(() => ({
    downloadFilesFromJson: vi.fn().mockResolvedValue([])
  }))
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

  beforeEach(async () => {
    vi.clearAllMocks();
    
    const mockProgressManager = new (await import('../managers/progress-manager.js')).default();
    const mockDownloadService = new (await import('../services/download.service.js')).default(mockProgressManager);
    mockDownloadManager = new (await import('../managers/download-manager.js')).default(mockProgressManager, mockDownloadService);

    const { container } = await import('../config/container.js');
    vi.mocked(container.get).mockReturnValue(mockDownloadManager);

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
    it('should display help and return success when help option is true', async () => {
      // given
      const options = { help: true };

      // when
      const result = await executeDownload(options);

      // then
      expect(result).toEqual({ success: true, files: [] });
      expect(console.log).toHaveBeenCalledWith('Usage: gs-download [options]');
      const { container } = await import('../config/container.js');
      expect(container.get).not.toHaveBeenCalled();
    });

    it('should download files successfully', async () => {
      // given
      const options = {
        host: 'example.com',
        port: 9000,
        target: '/downloads'
      };

      const mockFiles = [
        new FileInfo('file1', 'file1.pdf'),
        new FileInfo('file2', 'file2.pdf')
      ];

      mockDownloadManager.downloadFilesFromJson = vi.fn().mockResolvedValue(mockFiles);

      // when
      const result = await executeDownload(options);

      // then
      expect(result).toEqual({ success: true, files: mockFiles });

      expect(logger.info).toHaveBeenCalledWith('Starting download process');
      expect(logger.info).toHaveBeenCalledWith('Base URL: http://example.com:9000');
      expect(logger.info).toHaveBeenCalledWith('JSON file URL: http://example.com:9000/files');
      expect(logger.info).toHaveBeenCalledWith('Target directory: /downloads');

      expect(mockDownloadManager.downloadFilesFromJson).toHaveBeenCalledWith(
        'http://example.com:9000/files',
        'http://example.com:9000',
        '/downloads'
      );

      expect(logger.info).toHaveBeenCalledWith('Successfully downloaded 2 files to /downloads');
    });

    it('should log a warning when no files are downloaded', async () => {
      // given
      const options = {
        host: 'example.com',
        port: 9000,
        target: '/downloads'
      };

      mockDownloadManager.downloadFilesFromJson = vi.fn().mockResolvedValue([]);

      // when
      const result = await executeDownload(options);

      // then
      expect(result).toEqual({ success: true, files: [] });
      expect(logger.warn).toHaveBeenCalledWith('No files were downloaded');
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
      expect(result).toEqual({ success: false, error: 'Download failed' });
      expect(logger.error).toHaveBeenCalledWith('Download process failed: Download failed');
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
      expect(result).toEqual({ success: false, error: 'String error' });
      expect(logger.error).toHaveBeenCalledWith('Download process failed: String error');
    });
  });
});
