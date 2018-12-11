export default class Line {
    constructor({indent, value, terminator, newline} = {}){
        this.indent = indent
        this.terminator = terminator ? terminator : ''
        this.line = value;
        this.newline = newline ? newline : '\n'
    }

    setIndent(value){
        this.indent = value
    }
    
    getIndent(){
        return this.indent
    }

    getTerminator(){
        return this.terminator
    }

    setTerminator(terminator){
        this.terminator = terminator
    }

    indentation(){
        let indentation = "";
        if(this.indent && this.indent > 0){
          for(let i = 0; i < this.indent; i++){
            indentation = indentation + "  "
          }
        }
        return indentation;
    }

    build(){
        return this.indentation() + this.line + this.getTerminator() + this.newline
    }
}
