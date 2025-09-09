#!/usr/bin/env node

import 'reflect-metadata';
import { fileURLToPath } from "node:url";

import commandLineArgs from 'command-line-args';
import { container } from '../config/container.js';
import { TYPES } from '../config/types.js';
import DownloadManager from "../managers/download-manager.js";
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
    return true;
  }

  try {
    const host = options.host as string;
    const port = options.port as number;
    const target = options.target as string;

    const baseUrl = `http://${host}:${port}`;
    const jsonFileUrl = `${baseUrl}/files`;

    logger.info(`Connecting to ${host}:${port}`);
    logger.info(`Target directory: ${target}`);

    const downloadManager = container.get<DownloadManager>(TYPES.DownloadManager);

    const downloadedFiles = await downloadManager.downloadFilesFromJson(jsonFileUrl, baseUrl, target);

    logger.info(`Download completed. ${downloadedFiles.length} files downloaded.`);

    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Download failed: ${errorMessage}`);
    return false;
  }
}

if (
  process.argv[1] === fileURLToPath(import.meta.url)
  || process.argv[1]?.endsWith('/gs-download')
  || process.argv[1]?.endsWith('\\gs-download.cmd')
) {
  const options = commandLineArgs(optionDefinitions);

  executeDownload(options)
    .then(result => {
      process.exit(result ? 0 : 1);
    })
    .catch(error => {
      logger.error(`Unexpected error: ${error}`);
      process.exit(1);
    });
}
