export default class Block {
  constructor (frameId, indent, line) {
    this._lines = []
    this._frameId = frameId
    this._indent = indent

    if(line) {
      this.addLine(line)
    }
  }

  addLineToTop (line) {
    line.frameId = this._frameId
    this._lines.unshift(this.indent(line))
  }

  addLine (line) {
    line.frameId = this._frameId
    this._lines.push(this.indent(line))
  }

  indent(line){
    if(this._indent && this._indent > 0){
      let indentation = "";
      for(let i = 0; i < this._indent; i++){
        indentation = indentation + "  ";
      }
      line.value = indentation + line.value;
    }
    return line;
  }

  getLines () {
    return this._lines;
  }
}
