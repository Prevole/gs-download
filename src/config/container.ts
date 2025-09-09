import 'reflect-metadata';
import { Container } from 'inversify';
import DownloadManager from '../managers/download-manager.js';
import ProgressManager from '../managers/progress-manager.js';
import DownloadService from '../services/download.service.js';
import { TYPES } from './types.js';

const container = new Container();

container.bind<ProgressManager>(TYPES.ProgressManager).to(ProgressManager).inSingletonScope();
container.bind<DownloadService>(TYPES.DownloadService).to(DownloadService).inSingletonScope();
container.bind<DownloadManager>(TYPES.DownloadManager).to(DownloadManager).inSingletonScope();

export { container };
