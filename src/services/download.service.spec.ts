import { Buffer } from 'buffer';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import {ClientRequest, get, IncomingMessage} from 'node:http';
import { Writable } from "node:stream";
import { vi } from 'vitest';

import ProgressManager from '../managers/progress-manager.js';
import FileInfo from '../models/file-info.model.js';
import { createMock, mockClientRequest, unsafeCast } from "../test/test-utils.js";
import logger from '../utils/logger.js';
import DownloadService from './download.service.js';

declare const global: typeof globalThis;

vi.mock('fs', () => ({
  createWriteStream: vi.fn().mockReturnValue({
    on: vi.fn().mockImplementation(function(this: Writable, event, callback) {
      if (event === 'finish') {
        callback();
      }

      return this;
    }),

    close: vi.fn()
  }),

  existsSync: vi.fn().mockReturnValue(true),
  mkdirSync: vi.fn()
}));

vi.mock('node:http', () => ({
  get: vi.fn()
}));

vi.mock('../utils/logger.js', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn()
  }
}));

describe('DownloadService', () => {
  let downloadService: DownloadService;
  let mockProgressManager: ProgressManager;
  let mockResponse: Partial<IncomingMessage>;
  let mockFileInfo: FileInfo;

  beforeEach(() => {
    vi.clearAllMocks();

    mockProgressManager = {
      create: vi.fn(),
      update: vi.fn(),
      done: vi.fn(),
      stop: vi.fn()
    } as unknown as ProgressManager;

    downloadService = new DownloadService(mockProgressManager);

    mockFileInfo = new FileInfo('test-uid', 'test-file.pdf');

    mockResponse = {
      statusCode: 200,
      pipe: vi.fn(),
      headers: {
        'content-length': '1000'
      },
      on: vi.fn().mockImplementation((event, callback)=> {
        if (event === 'data') {
          callback(Buffer.from('test data'));
        }
      })
    };

    const mockClientRequest = createMock<ClientRequest>();

    vi.mocked(unsafeCast<(url: string | URL, cb: (res: IncomingMessage) => void) => ClientRequest>(get))
      .mockImplementation((url: string | URL, callback) => {
        callback(mockResponse as IncomingMessage);
        return mockClientRequest;
      });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue([
        { uid: 'file1', name: 'File 1.pdf' },
        { uid: 'file2', name: 'File 2.pdf' }
      ])
    });
  });

  describe('downloadFile', () => {
    it('should download a file successfully', async () => {
      // given
      const baseUrl = 'http://example.com';
      const outputDir = './downloads';

      // when
      const result = await downloadService.downloadFile(mockFileInfo, baseUrl, outputDir);

      // then
      expect(result).toBe('downloads/test-file.pdf');
      expect(get).toHaveBeenCalledWith('http://example.com/files/test-uid', expect.any(Function));
      expect(createWriteStream).toHaveBeenCalledWith('downloads/test-file.pdf');
      expect(mockProgressManager.create).toHaveBeenCalledWith(mockFileInfo.labeledName, 1000);
      expect(mockProgressManager.update).toHaveBeenCalledWith(mockFileInfo.labeledName, expect.any(Number));
      expect(mockProgressManager.done).toHaveBeenCalledWith(mockFileInfo.labeledName);
    });

    it('should throw an error if file UID is missing', async () => {
      // given
      const invalidFileInfo = new FileInfo('', 'test-file.pdf');
      const baseUrl = 'http://example.com';

      // when/then
      await expect(downloadService.downloadFile(invalidFileInfo, baseUrl))
        .rejects.toThrow('File UID is required');
      expect(logger.error).toHaveBeenCalledWith('Download failed: File UID is missing');
    });

    it('should throw an error if base URL is missing', async () => {
      // given
      const baseUrl = '';

      // when/then
      await expect(downloadService.downloadFile(mockFileInfo, baseUrl))
        .rejects.toThrow('Base URL is required');
      expect(logger.error).toHaveBeenCalledWith('Download failed: Base URL is missing');
    });

    it('should create output directory if it does not exist', async () => {
      // given
      const baseUrl = 'http://example.com';
      const outputDir = './downloads';
      vi.mocked(existsSync).mockReturnValueOnce(false);

      // when
      await downloadService.downloadFile(mockFileInfo, baseUrl, outputDir);

      // then
      expect(existsSync).toHaveBeenCalledWith(outputDir);
      expect(mkdirSync).toHaveBeenCalledWith(outputDir, { recursive: true });
    });

    it('should handle HTTP error responses', async () => {
      // given
      const baseUrl = 'http://example.com';
      mockResponse.statusCode = 404;

      // when/then
      await expect(downloadService.downloadFile(mockFileInfo, baseUrl))
        .rejects.toThrow('Download failed: 404');
    });

    it('should handle network errors', async () => {
      // given
      const baseUrl = 'http://example.com';

      vi.mocked(get).mockImplementation(() => {
        const clientRequestMock = mockClientRequest();

        process.nextTick(() => {
          clientRequestMock.emit('error', new Error('Network error'));
        })

        return clientRequestMock;
      });

      // when/then
      await expect(downloadService.downloadFile(mockFileInfo, baseUrl))
        .rejects.toThrow('Download failed: Network error');
      expect(mockProgressManager.done).toHaveBeenCalledWith(mockFileInfo.labeledName);
    });
  });

  describe('retrieveFileList', () => {
    it('should retrieve file list successfully', async () => {
      // given
      const jsonFileUrl = 'http://example.com/files.json';

      // when
      const result = await downloadService.retrieveFileList(jsonFileUrl);

      // then
      expect(result).toHaveLength(2);

      expect(result[0]).toBeInstanceOf(FileInfo);
      expect(result[0]?.uid).toBe('file1');
      expect(result[0]?.name).toBe('File 1.pdf');

      expect(result[1]).toBeInstanceOf(FileInfo);
      expect(result[1]?.uid).toBe('file2');
      expect(result[1]?.name).toBe('File 2.pdf');

      expect(fetch).toHaveBeenCalledWith(jsonFileUrl);
    });

    it('should throw an error if JSON file URL is missing', async () => {
      // given
      const jsonFileUrl = '';

      // when/then
      await expect(downloadService.retrieveFileList(jsonFileUrl))
        .rejects.toThrow('JSON file URL is required');
      expect(logger.error).toHaveBeenCalledWith('Download failed: JSON file URL is missing');
    });

    it('should throw an error if HTTP request fails', async () => {
      // given
      const jsonFileUrl = 'http://example.com/files.json';
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      // when/then
      await expect(downloadService.retrieveFileList(jsonFileUrl))
        .rejects.toThrow('HTTP error 404 Not Found');
      expect(logger.error).toHaveBeenCalledWith('Download failed: HTTP error 404 Not Found');
    });

    it('should throw an error if response is not an array', async () => {
      // given
      const jsonFileUrl = 'http://example.com/files.json';
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ notAnArray: true })
      });

      // when/then
      await expect(downloadService.retrieveFileList(jsonFileUrl))
        .rejects.toThrow('Invalid JSON format: expected an array');
    });

    it('should throw an error if array items are missing required properties', async () => {
      // given
      const jsonFileUrl = 'http://example.com/files.json';
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue([
          { uid: 'file1' },
          { name: 'File 2.pdf' }
        ])
      });

      // when/then
      await expect(downloadService.retrieveFileList(jsonFileUrl))
        .rejects.toThrow('Invalid JSON format: items must have uid and name');
    });

    it('should handle fetch errors', async () => {
      // given
      const jsonFileUrl = 'http://example.com/files.json';
      const fetchError = new Error('Network error');
      global.fetch = vi.fn().mockRejectedValue(fetchError);

      // when/then
      await expect(downloadService.retrieveFileList(jsonFileUrl))
        .rejects.toThrow('Failed to retrieve file list: Network error');
      expect(logger.error).toHaveBeenCalledWith('Failed to retrieve file list: Network error');
    });
  });
});
