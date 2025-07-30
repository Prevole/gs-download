import { MultiBar, SingleBar } from 'cli-progress';
import { injectable } from 'inversify';

@injectable()
export default class ProgressManager {
  private multiBar: MultiBar;
  private bars: Map<string, SingleBar>;

  constructor() {
    this.multiBar = new MultiBar({
      format: '{name} | {bar} | {percentage}% | {value} / {total}',
      clearOnComplete: false,
      hideCursor: true,
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
    });

    this.bars = new Map();
  }

  create(name: string, total: number): void {
    this.bars.set(name, this.multiBar.create(total, 0, { name }));
  }

  update(name: string, value: number | null = null): void {
    if (value === null) {
      this.bars.get(name)?.increment();
    } else {
      this.bars.get(name)?.update(value);
    }
  }

  done(name: string) {
    const bar = this.bars.get(name);
    if (!bar) return;

    this.multiBar.remove(bar);
    this.bars.delete(name);
  }

  stop(): void {
    this.multiBar.stop();
  }
}
