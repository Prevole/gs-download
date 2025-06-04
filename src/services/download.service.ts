import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { get } from "node:http";
import { join } from 'path';
import { FileInfo } from '../models/file-info.model.js';
import logger from '../utils/logger.js';

export class DownloadService {
  async downloadFile(fileInfo: FileInfo, baseUrl: string, outputDir = '.'): Promise<string> {
    if (!fileInfo.uid) {
      const error = new Error('File UID is required');
      logger.error('Download failed: File UID is missing');
      throw error;
    }

    if (!baseUrl) {
      const error = new Error('Base URL is required');
      logger.error('Download failed: Base URL is missing');
      throw error;
    }

    logger.info(`Starting download for file with UID: ${fileInfo.uid}`);
    logger.info(`Using base URL: ${baseUrl}`);

    if (!existsSync(outputDir)) {
      logger.info(`Creating output directory: ${outputDir}`);
      mkdirSync(outputDir, { recursive: true });
    }

    const downloadUrl = `${baseUrl.replace(/\/+$/, '')}/files/${fileInfo.uid}`;

    const outputFilePath = join(outputDir, `${fileInfo.simplifiedName}.pdf`);

    logger.info(`Download URL: ${downloadUrl}`);
    logger.info(`Output file path: ${outputFilePath}`);

    logger.info('Initiating download request');

    return new Promise((resolve, reject) => {
      get(downloadUrl, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Download failed: ${response.statusCode}`));
          return;
        }

        const fileStream = createWriteStream(outputFilePath);

        response.pipe(fileStream);

        fileStream.on('finish', () => {
          fileStream.close();
          resolve("Download completed successfully");
        });
      })
      .on('error', (err) => { reject(new Error(`Download failed: ${err.message}`) );
      });
    });
  }

  async retrieveFileList(jsonFileUrl: string): Promise<FileInfo[]> {
    if (!jsonFileUrl) {
      logger.error('Download failed: JSON file URL is missing');
      throw new Error('JSON file URL is required');
    }

    logger.info(`Starting retrieval of file list from: ${jsonFileUrl}`);

    try {
      const response = await fetch(jsonFileUrl);

      if (!response.ok) {
        const message = `HTTP error ${response.status} ${response.statusText}`;
        logger.error(`Download failed: ${message}`);
        throw new Error(message);
      }

      const body = await response.json();

      if (!Array.isArray(body)) {
        throw new Error('Invalid JSON format: expected an array');
      }

      const isValid = body.every(item =>
        typeof item === 'object' && item !== null && 'uid' in item && 'name' in item
      );

      if (!isValid) {
        throw new Error('Invalid JSON format: items must have uid and name');
      }

      logger.info(`Found ${body.length} files in the list`);
      return body.map(item => new FileInfo(item.uid, item.name));

    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error(`Failed to retrieve file list: ${message}`);
      throw new Error(`Failed to retrieve file list: ${message}`);
    }
  }
}

export default new DownloadService();
