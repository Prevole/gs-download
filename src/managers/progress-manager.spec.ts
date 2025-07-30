import { MultiBar } from 'cli-progress';
import { vi } from 'vitest';
import 'reflect-metadata';
import { setupInversifyMocks } from '../test/test-utils.js';
import ProgressManager from './progress-manager.js';

setupInversifyMocks();

const mockSingleBar = {
  increment: vi.fn(),
  update: vi.fn()
};

const mockMultiBar = {
  create: vi.fn().mockReturnValue(mockSingleBar),
  remove: vi.fn(),
  stop: vi.fn()
};

vi.mock('cli-progress', () => ({
  MultiBar: vi.fn().mockImplementation(() => mockMultiBar)
}));

describe('ProgressManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize MultiBar with correct options', () => {
      // given/when
      new ProgressManager();

      // then
      expect(MultiBar).toHaveBeenCalledWith({
        format: '{name} | {bar} | {percentage}% | {value} / {total}',
        clearOnComplete: false,
        hideCursor: true,
        barCompleteChar: '\u2588',
        barIncompleteChar: '\u2591',
      });
    });

    it('should initialize an empty bars Map', () => {
      // given
      const progressManager = new ProgressManager();

      // when
      progressManager.update('nonexistent');

      // then
      expect(mockSingleBar.increment).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create a new progress bar with the given name and total', () => {
      // given
      const progressManager = new ProgressManager();
      const name = 'test-bar';
      const total = 100;

      // when
      progressManager.create(name, total);

      // then
      expect(mockMultiBar.create).toHaveBeenCalledWith(total, 0, { name });
    });

    it('should store the created bar in the bars Map', () => {
      // given
      const progressManager = new ProgressManager();
      const name = 'test-bar';
      const total = 100;

      // when
      progressManager.create(name, total);
      progressManager.update(name);

      // then
      expect(mockSingleBar.increment).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should increment the bar if value is null', () => {
      // given
      const progressManager = new ProgressManager();
      const name = 'test-bar';

      progressManager.create(name, 100);

      vi.clearAllMocks();

      // when
      progressManager.update(name);

      // then
      expect(mockSingleBar.increment).toHaveBeenCalled();
      expect(mockSingleBar.update).not.toHaveBeenCalled();
    });

    it('should update the bar with the given value if not null', () => {
      // given
      const progressManager = new ProgressManager();
      const name = 'test-bar';
      const value = 50;

      progressManager.create(name, 100);

      vi.clearAllMocks();

      // when
      progressManager.update(name, value);

      // then
      expect(mockSingleBar.update).toHaveBeenCalledWith(value);
      expect(mockSingleBar.increment).not.toHaveBeenCalled();
    });

    it('should do nothing if the bar does not exist', () => {
      // given
      const progressManager = new ProgressManager();
      const name = 'nonexistent-bar';

      // when
      progressManager.update(name);

      // then
      expect(mockSingleBar.increment).not.toHaveBeenCalled();
      expect(mockSingleBar.update).not.toHaveBeenCalled();
    });
  });

  describe('done', () => {
    it('should remove the bar from the multiBar and delete it from the bars Map', () => {
      // given
      const progressManager = new ProgressManager();
      const name = 'test-bar';

      progressManager.create(name, 100);

      vi.clearAllMocks(); // Clear mocks after create

      // when
      progressManager.done(name);

      // then
      expect(mockMultiBar.remove).toHaveBeenCalledWith(mockSingleBar);
      
      // Verify the bar is removed from the map by trying to update it
      progressManager.update(name);
      expect(mockSingleBar.increment).not.toHaveBeenCalled();
    });
  });

  describe('stop', () => {
    it('should stop the multiBar', () => {
      // given
      const progressManager = new ProgressManager();

      // when
      progressManager.stop();

      // then
      expect(mockMultiBar.stop).toHaveBeenCalled();
    });
  });
});
