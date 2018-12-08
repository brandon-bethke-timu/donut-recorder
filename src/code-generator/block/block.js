export default class Block {
  constructor ({indent} = {}) {
      this._indent = indent ? indent : 0
      this._lines = []
  }

  addLineToTop (line) {
    this._lines.unshift(this.indent(line))
  }

  addLine (line) {
      this._lines.push(this.indent(line))
  }

  addBlock(block){
      this._lines.push(block)
  }

  setIndent(indent){
      this._indent = indent;
  }

  getIndent(){
      return this._indent;
  }

  indent(line){
      let indentation = "";
      if(this._indent && this._indent > 0){
        for(let i = 0; i < this._indent; i++){
          indentation = indentation + "  ";
        }
      }
      line.value = indentation + line.value
      return line
  }

  getLines () {
      return this._lines;
  }

  build() {
      let lines = this.getLines();
      let script = ''
      let total = lines.length;
      for(let i = 0; i < total; i++){
          let line = lines[i];
          if(line instanceof Block){
              script = script + line.build()
          } else {
              script = script + line.value + "\n"
          }
      }
      return script
  }
}
