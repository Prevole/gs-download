const WIDTH = 25;

export default class FileInfo {
  readonly simplifiedName: string;
  readonly labeledName: string;

  constructor(
    readonly uid: string,
    readonly name: string,
  ) {
    this.simplifiedName = this.name
      .replace(/\s*\([^)]*\)\s*/g, '')
      .replace(/\.pdf$/i, '')
      .trim()
    ;

    const normalizedName = this.name.trim();

    if (normalizedName.length > WIDTH) {
      this.labeledName = `${normalizedName.slice(0, WIDTH - 1)}…`;
    } else {
      this.labeledName = normalizedName.padEnd(WIDTH);
    }
  }
}
