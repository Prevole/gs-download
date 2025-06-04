import { DownloadManager, downloadManager, FileInfo, DownloadService, downloadService } from './index.js';

describe('Index exports', () => {
  // given

  // when/then
  it('should export the DownloadManager class', () => {
    expect(DownloadManager).toBeDefined();
    expect(typeof DownloadManager).toBe('function');
  });

  it('should export a default downloadManager instance', () => {
    expect(downloadManager).toBeDefined();
    expect(downloadManager).toBeInstanceOf(DownloadManager);
  });

  it('should export the FileInfo class', () => {
    const fileInfo = new FileInfo('test-uid', 'test-name');
    expect(fileInfo.uid).toBe('test-uid');
    expect(fileInfo.name).toBe('test-name');
    expect(fileInfo.simplifiedName).toBeDefined();
    // Getters are properties, not functions
    expect(typeof fileInfo.simplifiedName).toBe('string');
  });

  it('should export the DownloadService class', () => {
    expect(DownloadService).toBeDefined();
    expect(typeof DownloadService).toBe('function');
  });

  it('should export a default downloadService instance', () => {
    expect(downloadService).toBeDefined();
    expect(downloadService).toBeInstanceOf(DownloadService);
  });
});
