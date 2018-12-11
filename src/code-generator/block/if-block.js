import Block from './block'
import ScopedBlock from './scoped-block'
import Line from "./line"

export default class IfBlock extends ScopedBlock {
    constructor({indent, condition} = {}){
        super({indent})
        this.condition = condition;
        this._elseif = []
        this._else = undefined;
    }

    elseIf({indent, condition} = {}){
        indent = indent ? indent : this.getIndent();
        let item = new ElseIfBlock({indent, condition});
        this._elseif.push(item);
        return item;
    }
    else({indent} = {}) {
        indent = indent ? indent : this.getIndent();
        this._else = new ElseBlock({indent})
        return this._else;
    }

    build(){
        this._lines.unshift(new Line({indent: this.getIndent(), value: `if(${this.condition}){`}))
        this._lines.push(new Line({indent: this.getIndent(), value: `}`}))
        let script = super.build()
        for(let i = 0; i < this._elseif.length; i++){
            script = script + this._elseif[i].build();
        }
        if(this._else){
            script = script + this._else.build();
        }
        return script;
    }
}

class ElseIfBlock extends ScopedBlock {
    constructor({indent, condition} = {}){
        super({indent})
        this.condition = condition
    }

    build(){
        this._lines.unshift(new Line({indent: this.getIndent(), value: `else if(${this.condition}){`}))
        this._lines.push(new Line({indent: this.getIndent(), value: `}`}))
        return super.build()
    }
}

class ElseBlock extends ScopedBlock {
    constructor({indent} = {}){
        super({indent})
    }

    build(){
        this._lines.unshift(new Line({indent: this.getIndent(), value: `else{`}))
        this._lines.push(new Line({indent: this.getIndent(), value: `}`}))
        return super.build()
    }
}
