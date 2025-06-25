import FileInfo from './file-info.model.js';

describe('FileInfo', () => {
  describe('constructor', () => {
    it('should initialize properties correctly', () => {
      // given
      const uid = 'test-uid';
      const name = 'test-file.pdf';

      // when
      const fileInfo = new FileInfo(uid, name);

      // then
      expect(fileInfo.uid).toBe(uid);
      expect(fileInfo.name).toBe(name);
    });
  });

  describe('simplifiedName', () => {
    it('should remove both parentheses and .pdf extension', () => {
      // given
      const name = 'test-file (some content).pdf';

      // when
      const fileInfo = new FileInfo('uid', name);

      // then
      expect(fileInfo.simplifiedName).toBe('test-file');
    });

    it('should handle multiple parentheses', () => {
      // given
      const name = 'test-file (some content) (more content).pdf';

      // when
      const fileInfo = new FileInfo('uid', name);

      // then
      expect(fileInfo.simplifiedName).toBe('test-file');
    });

    it('should trim whitespace', () => {
      // given
      const name = '  test-file (some content).pdf  ';

      // when
      const fileInfo = new FileInfo('uid', name);

      // then
      expect(fileInfo.simplifiedName).toBe('test-file.pdf');
    });
  });

  describe('labeledName', () => {
    it('should truncate name with ellipsis if longer than WIDTH', () => {
      // given
      const name = 'this-is-a-very-long-file-name-that-exceeds-the-width-limit.pdf';

      // when
      const fileInfo = new FileInfo('uid', name);

      // then
      expect(fileInfo.labeledName.length).toBe(25);
      expect(fileInfo.labeledName).toBe('this-is-a-very-long-file…');
    });

    it('should pad name if not longer than WIDTH', () => {
      // given
      const name = 'short-name.pdf';

      // when
      const fileInfo = new FileInfo('uid', name);

      // then
      expect(fileInfo.labeledName.length).toBe(25);
      expect(fileInfo.labeledName).toBe('short-name.pdf'.padEnd(25));
    });

    it('should handle name exactly WIDTH characters long', () => {
      // given
      const name = 'exactly-25-chars-name.pdf';

      // when
      const fileInfo = new FileInfo('uid', name);

      // then
      expect(fileInfo.labeledName.length).toBe(25);
      expect(fileInfo.labeledName).toBe('exactly-25-chars-name.pdf');
    });
  });
});
