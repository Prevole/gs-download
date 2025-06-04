import { FileInfo } from './file-info.model.js';

describe('FileInfo', () => {
  describe('constructor', () => {
    it('should create a FileInfo instance with the provided uid and name', () => {
      // given
      const uid = 'test-uid';
      const name = 'test-name.pdf';
      
      // when
      const fileInfo = new FileInfo(uid, name);
      
      // then
      expect(fileInfo.uid).toBe(uid);
      expect(fileInfo.name).toBe(name);
    });
    
    it('should accept empty strings for uid and name', () => {
      // given
      const uid = '';
      const name = '';
      
      // when
      const fileInfo = new FileInfo(uid, name);
      
      // then
      expect(fileInfo.uid).toBe('');
      expect(fileInfo.name).toBe('');
    });
  });
  
  describe('simplifiedName', () => {
    it('should remove the .pdf extension from the filename', () => {
      // given
      const name = 'document.pdf';
      
      // when
      const fileInfo = new FileInfo('uid', name);
      
      // then
      expect(fileInfo.simplifiedName).toBe('document');
    });
    
    it('should remove content within parentheses including the parentheses', () => {
      // given
      const name = 'document (version 1).pdf';
      
      // when
      const fileInfo = new FileInfo('uid', name);
      
      // then
      expect(fileInfo.simplifiedName).toBe('document');
    });
    
    it('should handle multiple parentheses sections', () => {
      // given
      const name = 'document (version 1) (draft).pdf';
      
      // when
      const fileInfo = new FileInfo('uid', name);
      
      // then
      expect(fileInfo.simplifiedName).toBe('document');
    });
    
    it('should trim whitespace after removing parentheses', () => {
      // given
      const name = 'document   (version 1)   .pdf';
      
      // when
      const fileInfo = new FileInfo('uid', name);
      
      // then
      expect(fileInfo.simplifiedName).toBe('document');
    });
    
    it('should handle filenames in the format yyyy-mm-dd hh-mm', () => {
      // given
      const name = '2023-01-15 14-30.pdf';
      
      // when
      const fileInfo = new FileInfo('uid', name);
      
      // then
      expect(fileInfo.simplifiedName).toBe('2023-01-15 14-30');
    });
    
    it('should handle filenames in the format yyyy-mm-dd hh-mm with optional number', () => {
      // given
      const name = '2023-01-15 14-30 1.pdf';
      
      // when
      const fileInfo = new FileInfo('uid', name);
      
      // then
      expect(fileInfo.simplifiedName).toBe('2023-01-15 14-30 1');
    });
    
    it('should handle filenames in the format yyyy-mm-dd hh-mm with parentheses', () => {
      // given
      const name = '2023-01-15 14-30 (version 1).pdf';
      
      // when
      const fileInfo = new FileInfo('uid', name);
      
      // then
      expect(fileInfo.simplifiedName).toBe('2023-01-15 14-30');
    });
    
    it('should handle empty filename', () => {
      // given
      const name = '';
      
      // when
      const fileInfo = new FileInfo('uid', name);
      
      // then
      expect(fileInfo.simplifiedName).toBe('');
    });
    
    it('should handle filename shorter than 4 characters', () => {
      // given
      const name = 'abc.pdf';
      
      // when
      const fileInfo = new FileInfo('uid', name);
      
      // then
      expect(fileInfo.simplifiedName).toBe('abc');
    });
    
    it('should handle filename with exactly 4 characters', () => {
      // given
      const name = 'abcd.pdf';
      
      // when
      const fileInfo = new FileInfo('uid', name);
      
      // then
      expect(fileInfo.simplifiedName).toBe('abcd');
    });
    
    it('should handle filename with special characters', () => {
      // given
      const name = 'document-with_special!chars.pdf';
      
      // when
      const fileInfo = new FileInfo('uid', name);
      
      // then
      expect(fileInfo.simplifiedName).toBe('document-with_special!chars');
    });
  });
});
