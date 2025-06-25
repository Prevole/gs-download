import { homedir } from "node:os";
import path from "node:path";
import pino from 'pino';

const transport = pino.transport({
  target: 'pino-roll',
  options: {
    file: path.resolve(path.join(homedir(), 'Library', 'Logs', 'gs-download', 'app.log')),
    frequency: 'daily',
    size: '10m',
    mkdir: true
  }
});

const logger = pino.default(transport);

export default logger;
