import { vi } from 'vitest';
import FileInfo from '../models/file-info.model.js';
import DownloadService from '../services/download.service.js';
import {createMock} from "../test/test-utils.js";
import logger from '../utils/logger.js';
import DownloadManager from './download-manager.js';
import ProgressManager from './progress-manager.js';

const mockMultiBar = {
  create: vi.fn().mockReturnValue({
    increment: vi.fn(),
    update: vi.fn()
  }),
  stop: vi.fn()
};

vi.mock('cli-progress', () => ({
  MultiBar: vi.fn().mockImplementation(() => mockMultiBar)
}));

const mockProgressManager = createMock<ProgressManager>({
  create: vi.fn(),
  update: vi.fn(),
  stop: vi.fn(),
  done: vi.fn()
});

const mockDownloadService = createMock<DownloadService>({
  retrieveFileList: vi.fn(),
  downloadFile: vi.fn()
});

vi.mock('../utils/logger.js', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}));

describe('DownloadManager', () => {
  let downloadManager: DownloadManager;

  beforeEach(() => {
    vi.clearAllMocks();

    downloadManager = new DownloadManager(mockProgressManager, mockDownloadService);
  });

  describe('downloadFilesFromJson', () => {
    const jsonFileUrl = 'https://example.com/files.json';
    const baseUrl = 'https://example.com';
    const outputDir = './downloads';

    const mockFileList = [
      new FileInfo('file1', 'File 1'),
      new FileInfo('file2', 'File 2'),
      new FileInfo('file3', 'File 3')
    ];

    const mockFilePaths: [string, string, string] = [
      './downloads/file1.pdf',
      './downloads/file2.pdf',
      './downloads/file3.pdf'
    ];

    it('should throw an error if jsonFileUrl is not provided', async () => {
      // given
      const emptyJsonFileUrl = '';

      // when
      const result = downloadManager.downloadFilesFromJson(emptyJsonFileUrl, baseUrl, outputDir);

      // then
      await expect(result).rejects.toThrow('JSON file URL is required');
      expect(logger.error).toHaveBeenCalledWith('Download process failed: JSON file URL is missing');
    });

    it('should throw an error if baseUrl is not provided', async () => {
      // given
      const emptyBaseUrl = '';

      // when
      const result = downloadManager.downloadFilesFromJson(jsonFileUrl, emptyBaseUrl, outputDir);

      // then
      await expect(result).rejects.toThrow('Base URL is required');
      expect(logger.error).toHaveBeenCalledWith('Download process failed: Base URL is missing');
    });

    it('should return an empty array if no files are found in the JSON', async () => {
      // given
      vi.mocked(mockDownloadService.retrieveFileList).mockResolvedValue([]);

      // when
      const result = await downloadManager.downloadFilesFromJson(jsonFileUrl, baseUrl, outputDir);

      // then
      expect(result).toEqual([]);
      expect(mockDownloadService.retrieveFileList).toHaveBeenCalledWith(jsonFileUrl);
      expect(mockDownloadService.downloadFile).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith('No files found in the JSON file');
    });

    it('should download all files and return their paths', async () => {
      // given
      vi.mocked(mockDownloadService.retrieveFileList).mockResolvedValue(mockFileList);
      vi.mocked(mockDownloadService.downloadFile)
        .mockResolvedValueOnce(mockFilePaths[0])
        .mockResolvedValueOnce(mockFilePaths[1])
        .mockResolvedValueOnce(mockFilePaths[2])
      ;

      // when
      const result = await downloadManager.downloadFilesFromJson(jsonFileUrl, baseUrl, outputDir);

      // then
      expect(result).toEqual(mockFilePaths);
      expect(mockDownloadService.retrieveFileList).toHaveBeenCalledWith(jsonFileUrl);
      expect(mockDownloadService.downloadFile).toHaveBeenCalledTimes(3);
      expect(mockDownloadService.downloadFile).toHaveBeenCalledWith(mockFileList[0], baseUrl, outputDir);
      expect(mockDownloadService.downloadFile).toHaveBeenCalledWith(mockFileList[1], baseUrl, outputDir);
      expect(mockDownloadService.downloadFile).toHaveBeenCalledWith(mockFileList[2], baseUrl, outputDir);
      expect(logger.info).toHaveBeenCalledWith(`Retrieved ${mockFileList.length} files from JSON`);
      expect(logger.info).toHaveBeenCalledWith(`Download process completed. Successfully downloaded ${mockFilePaths.length} of ${mockFileList.length} files`);
    });

    it('should continue downloading files even if one fails', async () => {
      // given
      vi.mocked(mockDownloadService.retrieveFileList).mockResolvedValue(mockFileList);
      vi.mocked(mockDownloadService.downloadFile)
        .mockResolvedValueOnce(mockFilePaths[0])
        .mockRejectedValueOnce(new Error('Download failed'))
        .mockResolvedValueOnce(mockFilePaths[2])
      ;

      // when
      const result = await downloadManager.downloadFilesFromJson(jsonFileUrl, baseUrl, outputDir);

      // then
      expect(result).toEqual([mockFilePaths[0], mockFilePaths[2]]);
      expect(mockDownloadService.retrieveFileList).toHaveBeenCalledWith(jsonFileUrl);
      expect(mockDownloadService.downloadFile).toHaveBeenCalledTimes(3);
      expect(logger.error).toHaveBeenCalledWith('Failed to download file File 2: Download failed');
    });

    it('should throw an error if retrieving the file list fails', async () => {
      // given
      const error = new Error('Failed to retrieve file list');
      vi.mocked(mockDownloadService.retrieveFileList).mockRejectedValue(error);

      // when
      const result = downloadManager.downloadFilesFromJson(jsonFileUrl, baseUrl, outputDir);

      // then
      await expect(result).rejects.toThrow('Failed to retrieve file list');
      expect(mockDownloadService.retrieveFileList).toHaveBeenCalledWith(jsonFileUrl);
      expect(mockDownloadService.downloadFile).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith('Download process failed: Failed to retrieve file list');
    });

    it('should initialize and update progress bars', async () => {
      // given
      vi.mocked(mockDownloadService.retrieveFileList).mockResolvedValue(mockFileList);
      vi.mocked(mockDownloadService.downloadFile)
        .mockResolvedValueOnce(mockFilePaths[0])
        .mockResolvedValueOnce(mockFilePaths[1])
        .mockResolvedValueOnce(mockFilePaths[2])
      ;

      // when
      await downloadManager.downloadFilesFromJson(jsonFileUrl, baseUrl, outputDir);

      // then
      expect(mockProgressManager.create).toHaveBeenCalledWith('Total', mockFileList.length);
      expect(mockProgressManager.update).toHaveBeenCalledTimes(3);
      expect(mockProgressManager.update).toHaveBeenCalledWith('Total');
      expect(mockProgressManager.stop).toHaveBeenCalled();
    });

    it('should use default output directory if not provided', async () => {
      // given
      vi.mocked(mockDownloadService.retrieveFileList).mockResolvedValue(mockFileList);
      vi.mocked(mockDownloadService.downloadFile)
        .mockResolvedValueOnce('./file1.pdf')
        .mockResolvedValueOnce('./file2.pdf')
        .mockResolvedValueOnce('./file3.pdf');

      // when
      const result = await downloadManager.downloadFilesFromJson(jsonFileUrl, baseUrl);

      // then
      expect(result).toEqual(['./file1.pdf', './file2.pdf', './file3.pdf']);
      expect(mockDownloadService.downloadFile).toHaveBeenCalledWith(mockFileList[0], baseUrl, '.');
      expect(mockDownloadService.downloadFile).toHaveBeenCalledWith(mockFileList[1], baseUrl, '.');
      expect(mockDownloadService.downloadFile).toHaveBeenCalledWith(mockFileList[2], baseUrl, '.');
      expect(logger.info).toHaveBeenCalledWith('Files will be saved to: .');
    });

    it('should handle a large number of files', async () => {
      // given
      const largeFileList: FileInfo[] = Array.from({ length: 100 }, (_, i) => 
        new FileInfo(`file${i}`, `File ${i}`)
      );

      vi.mocked(mockDownloadService.retrieveFileList).mockResolvedValue(largeFileList);
      vi.mocked(mockDownloadService.downloadFile).mockImplementation((fileInfo) => 
        Promise.resolve(`./downloads/${fileInfo.uid}.pdf`)
      );

      // when
      const result = await downloadManager.downloadFilesFromJson(jsonFileUrl, baseUrl, outputDir);

      // then
      expect(result.length).toBe(100);
      expect(mockProgressManager.create).toHaveBeenCalledWith('Total', 100);
      expect(mockProgressManager.update).toHaveBeenCalledTimes(100);
      expect(logger.info).toHaveBeenCalledWith('Retrieved 100 files from JSON');
      expect(logger.info).toHaveBeenCalledWith('Download process completed. Successfully downloaded 100 of 100 files');
    });

    it('should handle different types of download errors', async () => {
      // given
      vi.mocked(mockDownloadService.retrieveFileList).mockResolvedValue(mockFileList);
      vi.mocked(mockDownloadService.downloadFile)
        .mockResolvedValueOnce(mockFilePaths[0])
        .mockRejectedValueOnce(new TypeError('Network error'))
        .mockRejectedValueOnce('String error');

      // when
      const result = await downloadManager.downloadFilesFromJson(jsonFileUrl, baseUrl, outputDir);

      // then
      expect(result).toEqual([mockFilePaths[0]]);
      expect(logger.error).toHaveBeenCalledWith('Failed to download file File 2: Network error');
      expect(logger.error).toHaveBeenCalledWith('Failed to download file File 3: String error');
    });

    it('should log appropriate messages during the download process', async () => {
      // given
      vi.mocked(mockDownloadService.retrieveFileList).mockResolvedValue(mockFileList);
      vi.mocked(mockDownloadService.downloadFile)
        .mockResolvedValueOnce(mockFilePaths[0])
        .mockResolvedValueOnce(mockFilePaths[1])
        .mockResolvedValueOnce(mockFilePaths[2]);

      // when
      await downloadManager.downloadFilesFromJson(jsonFileUrl, baseUrl, outputDir);

      // then
      expect(logger.info).toHaveBeenCalledWith(`Starting download process from JSON file: ${jsonFileUrl}`);
      expect(logger.info).toHaveBeenCalledWith(`Using base URL: ${baseUrl}`);
      expect(logger.info).toHaveBeenCalledWith(`Files will be saved to: ${outputDir}`);
      expect(logger.info).toHaveBeenCalledWith(`Processing file: File 1 (file1)`);
      expect(logger.info).toHaveBeenCalledWith(`Successfully downloaded: File 1`);
      expect(logger.info).toHaveBeenCalledWith(`Processing file: File 2 (file2)`);
      expect(logger.info).toHaveBeenCalledWith(`Successfully downloaded: File 2`);
      expect(logger.info).toHaveBeenCalledWith(`Processing file: File 3 (file3)`);
      expect(logger.info).toHaveBeenCalledWith(`Successfully downloaded: File 3`);
    });
  });
});
