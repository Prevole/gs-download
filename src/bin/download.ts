#!/usr/bin/env node

import commandLineArgs from 'command-line-args';
import downloadManager from '../managers/download-manager.js';
import logger from '../utils/logger.js';

export const optionDefinitions = [
  { name: 'host', alias: 'h', type: String, defaultValue: 'localhost', description: 'Host name or IP address' },
  { name: 'port', alias: 'p', type: Number, defaultValue: 8080, description: 'Port number' },
  { name: 'target', alias: 't', type: String, defaultValue: '.', description: 'Target directory for downloaded files' },
  { name: 'help', alias: '?', type: Boolean, defaultValue: false, description: 'Display this help message' }
];

export function displayHelp() {
  console.log('Usage: gs-download [options]');
  console.log('Options:');
  optionDefinitions.forEach(option => {
    console.log(`  --${option.name}, -${option.alias}\t${option.description} (default: ${option.defaultValue})`);
  });
  return true;
}

export async function executeDownload(options: commandLineArgs.CommandLineOptions) {
  if (options.help) {
    displayHelp();
    return { success: true, files: [] };
  }

  const baseUrl = `http://${options.host}:${options.port}`;
  const jsonFileUrl = `${baseUrl}/files`;
  const targetDir = options.target;

  try {
    logger.info('Starting download process');
    logger.info(`Base URL: ${baseUrl}`);
    logger.info(`JSON file URL: ${jsonFileUrl}`);
    logger.info(`Target directory: ${targetDir}`);

    const downloadedFiles = await downloadManager.downloadFilesFromJson(jsonFileUrl, baseUrl, targetDir);

    if (downloadedFiles.length === 0) {
      logger.warn('No files were downloaded');
    } else {
      logger.info(`Successfully downloaded ${downloadedFiles.length} files to ${targetDir}`);
    }

    return { success: true, files: downloadedFiles };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Download process failed: ${errorMessage}`);
    return { success: false, error: errorMessage };
  }
}

if (process.argv[1] === import.meta.url || process.argv[1]?.endsWith('/gs-download') || process.argv[1]?.endsWith('\\gs-download.cmd')) {
  const options = commandLineArgs(optionDefinitions);

  executeDownload(options)
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      logger.error(`Unexpected error: ${error}`);
      process.exit(1);
    });
}
