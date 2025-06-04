import { existsSync, createWriteStream, WriteStream } from 'fs';
import { get, IncomingMessage, ClientRequest, RequestOptions } from 'node:http';
import mockFs from 'mock-fs';
import { vi } from 'vitest';
import { FileInfo } from '../models/file-info.model.js';
import { DownloadService } from './download.service.js';

vi.stubGlobal('fetch', vi.fn());

vi.mock('../utils/logger.js');
vi.mock('node:http');
vi.mock('fs', async () => {
  const actual = await vi.importActual('fs');
  return {
    ...actual,
    createWriteStream: vi.fn()
  };
});

function createGetMockImplementation(
  mockResponse: Partial<IncomingMessage>,
  mockRequest: Partial<ClientRequest>
) {
  return (
    url: string | URL,
    options?: RequestOptions | ((res: IncomingMessage) => void),
    callback?: ((res: IncomingMessage) => void)
  ): ClientRequest => {
    if (typeof options === 'function') {
      options(mockResponse as IncomingMessage);
    } else if (callback) {
      callback(mockResponse as IncomingMessage);
    }
    return mockRequest as ClientRequest;
  };
}

describe('DownloadService', () => {
  let downloadService: DownloadService;

  beforeEach(() => {
    downloadService = new DownloadService();

    mockFs({
      [process.cwd()]: {},
      '/new': {
        'output': {
          'dir': {}
        }
      }
    });
  });

  afterEach(() => {
    mockFs.restore();
    vi.clearAllMocks();
  });

  describe('downloadFile', () => {
    let mockFileStream: Partial<WriteStream>;

    beforeEach(() => {
      mockFileStream = {
        close: vi.fn(),
        on: vi.fn().mockImplementation((event, callback) => {
          if (event === 'finish') {
            callback();
          }
          return mockFileStream;
        })
      };

      vi.mocked(createWriteStream).mockReturnValue(mockFileStream as WriteStream);
    });

    it('should throw an error if fileUid is not provided', async () => {
      // given
      const fileInfo = new FileInfo('', 'test.pdf');
      const baseUrl = 'https://example.com';

      // when
      const result = downloadService.downloadFile(fileInfo, baseUrl);

      // then
      await expect(result).rejects.toThrow('File UID is required');
    });

    it('should throw an error if baseUrl is not provided', async () => {
      // given
      const fileInfo = new FileInfo('file123', 'test.pdf');
      const baseUrl = '';

      // when
      const result = downloadService.downloadFile(fileInfo, baseUrl);

      // then
      await expect(result).rejects.toThrow('Base URL is required');
    });

    it('should create output directory if it does not exist', async () => {
      // given
      const mockResponse: Partial<IncomingMessage> = {
        statusCode: 200,
        pipe: vi.fn(),
        on: vi.fn().mockReturnThis()
      };

      const mockRequest: Partial<ClientRequest> = {
        on: vi.fn().mockImplementation((_event, _callback) => {
          return mockRequest;
        })
      };

      vi.mocked(get).mockImplementation(createGetMockImplementation(mockResponse, mockRequest));
      const fileInfo = new FileInfo('file123', 'test.pdf');

      // when
      await downloadService.downloadFile(fileInfo, 'https://example.com', '/new/output/dir');

      // then
      expect(existsSync('/new/output/dir')).toBe(true);
    });

    it('should handle successful download with FileInfo object', async () => {
      // given
      const mockResponse: Partial<IncomingMessage> = {
        statusCode: 200,
        pipe: vi.fn(),
        on: vi.fn().mockReturnThis()
      };

      const mockRequest: Partial<ClientRequest> = {
        on: vi.fn().mockImplementation((_event, _callback) => {
          return mockRequest;
        })
      };

      vi.mocked(get).mockImplementation(createGetMockImplementation(mockResponse, mockRequest));
      const fileInfo = new FileInfo('file123', 'document.pdf');

      // when
      const result = await downloadService.downloadFile(fileInfo, 'https://example.com');

      // then
      expect(result).toBe("Download completed successfully");
      expect(get).toHaveBeenCalledWith('https://example.com/files/file123', expect.any(Function));
      expect(createWriteStream).toHaveBeenCalledWith(expect.stringContaining('document.pdf'));
    });

    it('should remove parentheses and their content from filename', async () => {
      // given
      const mockResponse: Partial<IncomingMessage> = {
        statusCode: 200,
        pipe: vi.fn(),
        on: vi.fn().mockReturnThis()
      };

      const mockRequest: Partial<ClientRequest> = {
        on: vi.fn().mockImplementation((_event, _callback) => {
          return mockRequest;
        })
      };

      vi.mocked(get).mockImplementation(createGetMockImplementation(mockResponse, mockRequest));
      const fileInfo = new FileInfo('file123', 'document (version 1).pdf');

      // when
      const result = await downloadService.downloadFile(fileInfo, 'https://example.com');

      // then
      expect(result).toBe("Download completed successfully");
      expect(get).toHaveBeenCalledWith('https://example.com/files/file123', expect.any(Function));
      expect(createWriteStream).toHaveBeenCalledWith(expect.stringContaining('document.pdf'));
      expect(createWriteStream).not.toHaveBeenCalledWith(expect.stringContaining('(version 1)'));
    });

    it('should handle HTTP error responses', async () => {
      // given
      const mockResponse: Partial<IncomingMessage> = {
        statusCode: 404,
        pipe: vi.fn(),
        on: vi.fn().mockReturnThis()
      };

      const mockRequest: Partial<ClientRequest> = {
        on: vi.fn().mockImplementation((_event, _callback) => {
          return mockRequest;
        })
      };

      vi.mocked(get).mockImplementation(createGetMockImplementation(mockResponse, mockRequest));
      const fileInfo = new FileInfo('file123', 'test.pdf');

      // when
      const result = downloadService.downloadFile(fileInfo, 'https://example.com');

      // then
      await expect(result).rejects.toThrow('Download failed: 404');
    });

    it('should handle network errors', async () => {
      // given
      const mockError = new Error('Network error');

      const mockRequest: Partial<ClientRequest> = {
        on: vi.fn().mockImplementation((_event, callback) => {
          if (_event === 'error') {
            callback(mockError);
          }
          return mockRequest;
        })
      };

      vi.mocked(get).mockReturnValue(mockRequest as ClientRequest);
      const fileInfo = new FileInfo('file123', 'test.pdf');

      // when
      const result = downloadService.downloadFile(fileInfo, 'https://example.com');

      // then
      await expect(result).rejects.toThrow('Download failed: Network error');
    });
  });

  describe('retrieveFileList', () => {
    it('should throw an error if jsonFileUrl is not provided', async () => {
      // given
      const jsonFileUrl = '';

      // when
      const result = downloadService.retrieveFileList(jsonFileUrl);

      // then
      await expect(result).rejects.toThrow('JSON file URL is required');
    });

    it('should handle network errors when downloading JSON file', async () => {
      // given
      const mockError = new Error('Network error');
      vi.mocked(fetch).mockRejectedValue(mockError);

      // when
      const result = downloadService.retrieveFileList('https://example.com/files.json');

      // then
      await expect(result).rejects.toThrow('Failed to retrieve file list: Network error');
    });

    it('should handle HTTP error responses when downloading JSON file', async () => {
      // given
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found'
      };
      vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

      // when
      const result = downloadService.retrieveFileList('https://example.com/files.json');

      // then
      await expect(result).rejects.toThrow('HTTP error 404 Not Found');
    });

    it('should handle non-array JSON format', async () => {
      // given
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ notAnArray: true })
      };
      vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

      // when
      const result = downloadService.retrieveFileList('https://example.com/files.json');

      // then
      await expect(result).rejects.toThrow('Invalid JSON format: expected an array');
    });

    it('should handle array with invalid items', async () => {
      // given
      const responseBody = [{ uid: 'file1' }, { name: 'file2' }, 'file3'];
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(responseBody)
      };
      vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

      // when
      const result = downloadService.retrieveFileList('https://example.com/files.json');

      // then
      await expect(result).rejects.toThrow('Invalid JSON format: items must have uid and name');
    });

    it('should successfully retrieve file list from JSON', async () => {
      // given
      const responseBody = [
        { uid: 'file1', name: 'File 1' },
        { uid: 'file2', name: 'File 2' },
        { uid: 'file3', name: 'File 3' }
      ];
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(responseBody)
      };
      vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

      // when
      const result = await downloadService.retrieveFileList('https://example.com/files.json');

      // then
      expect(fetch).toHaveBeenCalledWith('https://example.com/files.json');
      expect(result.length).toEqual(responseBody.length);

      for (let i = 0; i < result.length; i++) {
        expect(result[i]).toBeInstanceOf(FileInfo);
        expect(result[i]?.uid).toEqual(responseBody[i]?.uid);
        expect(result[i]?.name).toEqual(responseBody[i]?.name);
      }
    });
  });
});
