import { vi } from 'vitest';
import { FileInfo } from '../models/file-info.model.js';
import downloadService from '../services/download.service.js';
import { DownloadManager } from './download-manager.js';

vi.mock('../services/download.service.js', () => ({
  __esModule: true,
  default: {
    retrieveFileList: vi.fn(),
    downloadFile: vi.fn()
  }
}));

vi.mock('../utils/logger.js');

describe('DownloadManager', () => {
  let downloadManager: DownloadManager;

  beforeEach(() => {
    downloadManager = new DownloadManager();
  });

  describe('downloadFilesFromJson', () => {
    const jsonFileUrl = 'https://example.com/files.json';
    const baseUrl = 'https://example.com';
    const outputDir = './downloads';
    const mockFileList: FileInfo[] = [
      new FileInfo('file1', 'File 1'),
      new FileInfo('file2', 'File 2'),
      new FileInfo('file3', 'File 3')
    ];
    const mockFilePaths = [
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
    });

    it('should throw an error if baseUrl is not provided', async () => {
      // given
      const emptyBaseUrl = '';

      // when
      const result = downloadManager.downloadFilesFromJson(jsonFileUrl, emptyBaseUrl, outputDir);

      // then
      await expect(result).rejects.toThrow('Base URL is required');
    });

    it('should return an empty array if no files are found in the JSON', async () => {
      // given
      vi.mocked(downloadService.retrieveFileList).mockResolvedValue([]);

      // when
      const result = await downloadManager.downloadFilesFromJson(jsonFileUrl, baseUrl, outputDir);

      // then
      expect(result).toEqual([]);
      expect(downloadService.retrieveFileList).toHaveBeenCalledWith(jsonFileUrl);
      expect(downloadService.downloadFile).not.toHaveBeenCalled();
    });

    it('should download all files and return their paths', async () => {
      // given
      vi.mocked(downloadService.retrieveFileList).mockResolvedValue(mockFileList);
      vi.mocked(downloadService.downloadFile)
        .mockResolvedValueOnce(mockFilePaths[0] as string)
        .mockResolvedValueOnce(mockFilePaths[1] as string)
        .mockResolvedValueOnce(mockFilePaths[2] as string);

      // when
      const result = await downloadManager.downloadFilesFromJson(jsonFileUrl, baseUrl, outputDir);

      // then
      expect(result).toEqual(mockFilePaths);
      expect(downloadService.retrieveFileList).toHaveBeenCalledWith(jsonFileUrl);
      expect(downloadService.downloadFile).toHaveBeenCalledTimes(3);
      expect(downloadService.downloadFile).toHaveBeenCalledWith(mockFileList[0], baseUrl, outputDir);
      expect(downloadService.downloadFile).toHaveBeenCalledWith(mockFileList[1], baseUrl, outputDir);
      expect(downloadService.downloadFile).toHaveBeenCalledWith(mockFileList[2], baseUrl, outputDir);
    });

    it('should continue downloading files even if one fails', async () => {
      // given
      vi.mocked(downloadService.retrieveFileList).mockResolvedValue(mockFileList);
      vi.mocked(downloadService.downloadFile)
        .mockResolvedValueOnce(mockFilePaths[0] as string)
        .mockRejectedValueOnce(new Error('Download failed'))
        .mockResolvedValueOnce(mockFilePaths[2] as string);

      // when
      const result = await downloadManager.downloadFilesFromJson(jsonFileUrl, baseUrl, outputDir);

      // then
      expect(result).toEqual([mockFilePaths[0] as string, mockFilePaths[2] as string]);
      expect(downloadService.retrieveFileList).toHaveBeenCalledWith(jsonFileUrl);
      expect(downloadService.downloadFile).toHaveBeenCalledTimes(3);
    });

    it('should throw an error if retrieving the file list fails', async () => {
      // given
      const error = new Error('Failed to retrieve file list');
      vi.mocked(downloadService.retrieveFileList).mockRejectedValue(error);

      // when
      const result = downloadManager.downloadFilesFromJson(jsonFileUrl, baseUrl, outputDir);

      // then
      await expect(result).rejects.toThrow('Failed to retrieve file list');
      expect(downloadService.retrieveFileList).toHaveBeenCalledWith(jsonFileUrl);
      expect(downloadService.downloadFile).not.toHaveBeenCalled();
    });
  });
});
