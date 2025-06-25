import FileInfo from '../models/file-info.model.js';
import DownloadService from '../services/download.service.js';
import logger from '../utils/logger.js';
import ProgressManager from './progress-manager.js';

export default class DownloadManager {
  constructor(
    private progressManager: ProgressManager,
    private downloadService: DownloadService
  ) {}

  async downloadFilesFromJson(jsonFileUrl: string, baseUrl: string, outputDir = '.'): Promise<string[]> {
    if (!jsonFileUrl) {
      const error = new Error('JSON file URL is required');
      logger.error('Download process failed: JSON file URL is missing');
      throw error;
    }

    if (!baseUrl) {
      const error = new Error('Base URL is required');
      logger.error('Download process failed: Base URL is missing');
      throw error;
    }

    logger.info(`Starting download process from JSON file: ${jsonFileUrl}`);
    logger.info(`Using base URL: ${baseUrl}`);
    logger.info(`Files will be saved to: ${outputDir}`);

    try {
      const fileList: FileInfo[] = await this.downloadService.retrieveFileList(jsonFileUrl);
      logger.info(`Retrieved ${fileList.length} files from JSON`);

      if (fileList.length === 0) {
        logger.warn('No files found in the JSON file');
        return [];
      }

      this.progressManager.create('Total', fileList.length);

      const downloadedFiles: string[] = [];

      for (let i = 0; i < fileList.length; i++) {
        const fileInfo = fileList[i];
        logger.info(`Processing file: ${fileInfo?.name} (${fileInfo?.uid})`);
        try {
          const filePath = await this.downloadService.downloadFile(fileInfo!, baseUrl, outputDir);
          downloadedFiles.push(filePath);

          logger.info(`Successfully downloaded: ${fileInfo?.name}`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          logger.error(`Failed to download file ${fileInfo?.name}: ${errorMessage}`);
        } finally {
          this.progressManager.update('Total');
        }
      }

      this.progressManager.stop();

      logger.info(`Download process completed. Successfully downloaded ${downloadedFiles.length} of ${fileList.length} files`);
      return downloadedFiles;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Download process failed: ${errorMessage}`);
      throw error;
    }
  }
}
