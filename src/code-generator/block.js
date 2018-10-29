export default class Block {
  constructor (frameId, line) {
    this._lines = []
    this._frameId = frameId
    this._indent = 0

    if (line) {
      line.frameId = this._frameId
      this._lines.push(line)
    }
  }

  addLineToTop (line) {
    line.frameId = this._frameId
    this._lines.unshift(line)
  }

  addLine (line) {
    line.frameId = this._frameId
    this._lines.push(line)
  }

  indent(value){
    this._indent = value;
  }

  getLines () {
    if(this._indent > 0){
      let indentation = "";
      for(let i = 0; i < this._indent; i++){
        indentation = indentation + "  ";
      }
      for (let line of this._lines){
        line.value = indentation + line.value;
      }
    }
    return this._lines;
  }
}
