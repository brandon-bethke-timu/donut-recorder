import Line from "./line"

export default class Block {
  constructor ({indent} = {}) {
      this._indent = indent
      this._lines = []
  }

  add(item){
      if(typeof(item) === "string"){
          this._lines.push(new Line({value: item}))
      } else {
          this._lines.push(item)
      }
  }

  setIndent(value){
      this._indent = value;
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
          let item = lines[i];
          if(item.getIndent() === undefined){
              item.setIndent(this.getIndent());
          }
          script = script + item.build()
      }
      return script
  }
}
