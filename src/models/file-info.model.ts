export class FileInfo {
  readonly simplifiedName: string;

  constructor(
    readonly uid: string,
    readonly name: string,
  ) {
    this.simplifiedName = this.name
      .replace(/\s*\([^)]*\)\s*/g, '')
      .replace(/\.pdf$/i, '')
      .trim()
    ;
  }
}
