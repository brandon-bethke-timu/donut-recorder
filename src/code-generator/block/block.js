import Line from "./line"

export default class Block {
  constructor ({indent} = {}) {
      this._indent = indent
      this._lines = []
  }

  add(item){
      if(typeof(item) === "string"){
          this._lines.push(new Line({indent: this.getIndent(), value: item}))
      } else {
          if(item.getIndent() === undefined){
              item.setIndent(this.getIndent())
          }
          this._lines.push(item)
      }
  }

  setIndent(indent){
      this._indent = indent;
  }

  getIndent(){
      return this._indent;
  }

  indentation(line){
      let indentation = "";
      if(this._indent && this._indent > 0){
        for(let i = 0; i < this._indent; i++){
          indentation = indentation + "  ";
        }
      }
      return indentation;
  }

  getLines () {
      return this._lines;
  }

  build() {
      let lines = this.getLines();
      let script = ''
      let indentation = this.indentation();
      let total = lines.length;
      for(let i = 0; i < total; i++){
          let line = lines[i];
          if(line instanceof Line){
              script = script + line.build()
          } else if(line instanceof Block){
              script = script + line.build()
          } else {
              script = script + indentation + line.value + "\n"
          }
      }
      return script
  }
}
