import { join } from 'path';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import downloadManager from '../managers/download-manager.js';
import logger from '../utils/logger.js';
import { executeDownload, displayHelp, optionDefinitions } from './download.js';

vi.mock('../managers/download-manager.js');
vi.mock('../utils/logger.js');

describe('download binary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should download files with default options', async () => {
    // given
    const options = {
      host: 'localhost',
      port: 8080,
      target: '.',
      help: false
    };

    const downloadResult = [
      join('.', 'file1.pdf'),
      join('.', 'file2.pdf')
    ];

    vi.mocked(downloadManager.downloadFilesFromJson).mockResolvedValue(downloadResult);

    // when
    const result = await executeDownload(options);

    // then
    expect(downloadManager.downloadFilesFromJson).toHaveBeenCalledWith(
      'http://localhost:8080/files',
      'http://localhost:8080',
      '.'
    );
    expect(logger.info).toHaveBeenCalledWith('Starting download process');
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Successfully downloaded'));
    expect(result.success).toBe(true);
    expect(result.files).toEqual(downloadResult);
  });

  it('should handle case when no files are downloaded', async () => {
    // given
    const options = {
      host: 'localhost',
      port: 8080,
      target: '.',
      help: false
    };

    vi.mocked(downloadManager.downloadFilesFromJson).mockResolvedValue([]);

    // when
    const result = await executeDownload(options);

    // then
    expect(downloadManager.downloadFilesFromJson).toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith('No files were downloaded');
    expect(result.success).toBe(true);
    expect(result.files).toEqual([]);
  });

  it('should handle download errors', async () => {
    // given
    const options = {
      host: 'localhost',
      port: 8080,
      target: '.',
      help: false
    };

    const error = new Error('Download failed');
    vi.mocked(downloadManager.downloadFilesFromJson).mockRejectedValue(error);

    // when
    const result = await executeDownload(options);

    // then
    expect(downloadManager.downloadFilesFromJson).toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith('Download process failed: Download failed');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Download failed');
  });

  it('should handle custom options', async () => {
    // given
    const options = {
      host: 'example.com',
      port: 9090,
      target: 'output',
      help: false
    };

    const downloadResult = [
      join('output', 'file1.pdf')
    ];

    vi.mocked(downloadManager.downloadFilesFromJson).mockResolvedValue(downloadResult);

    // when
    const result = await executeDownload(options);

    // then
    expect(downloadManager.downloadFilesFromJson).toHaveBeenCalledWith(
      'http://example.com:9090/files',
      'http://example.com:9090',
      'output'
    );
    expect(logger.info).toHaveBeenCalledWith('Target directory: output');
    expect(result.success).toBe(true);
    expect(result.files).toEqual(downloadResult);
  });

  it('should display help and exit when help option is true', async () => {
    // given
    const options = {
      host: 'localhost',
      port: 8080,
      target: '.',
      help: true
    };

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    // when
    const result = await executeDownload(options);

    // then
    expect(consoleSpy).toHaveBeenCalledWith('Usage: gs-download [options]');
    expect(consoleSpy).toHaveBeenCalledWith('Options:');
    expect(result.success).toBe(true);
    expect(result.files).toEqual([]);
    expect(downloadManager.downloadFilesFromJson).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should have the required command line options', () => {
    // given
    // No specific setup needed

    // when
    // Accessing optionDefinitions directly

    // then
    expect(optionDefinitions).toContainEqual(
      expect.objectContaining({ name: 'host', alias: 'h' })
    );
    expect(optionDefinitions).toContainEqual(
      expect.objectContaining({ name: 'port', alias: 'p' })
    );
    expect(optionDefinitions).toContainEqual(
      expect.objectContaining({ name: 'target', alias: 't' })
    );
    expect(optionDefinitions).toContainEqual(
      expect.objectContaining({ name: 'help', alias: '?' })
    );
  });

  it('should display help with all options', () => {
    // given
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    // when
    displayHelp();

    // then
    expect(consoleSpy).toHaveBeenCalledWith('Usage: gs-download [options]');
    expect(consoleSpy).toHaveBeenCalledWith('Options:');

    optionDefinitions.forEach(option => {
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(`--${option.name}, -${option.alias}`)
      );
    });

    consoleSpy.mockRestore();
  });
});
