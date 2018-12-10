import ScopedBlock from './scoped-block'
export default class IfBlock extends ScopedBlock {
    constructor({indent, condition} = {}){
        super({indent})
        this._lines.unshift(this.indent({value: `if(${condition}){`}))
        this._lines.push(this.indent({value: `}`}))
        this.setIndent(this._indent + 1)
    }

    elseIf({indent, condition} = {}){
        indent = indent ? indent : this.getIndent();
        this.elseif = new ElseIfBlock({indent, condition});
        this.addBlockAfterScope(this.elseif)
        return this.elseif;
    }
    else({indent} = {}) {
        indent = indent ? indent : this.getIndent();
        this.else = new ElseBlock({indent})
        this.addBlockAfterScope(this.else)
        return this.else;
    }
}

class ElseIfBlock extends ScopedBlock {
    constructor({indent, condition} = {}){
        super({indent})
        this._lines.unshift(this.indent({value: `else if(${condition}){`}))
        this._lines.push(this.indent({value: `}`}))
        this.setIndent(this._indent + 1)
    }
}

class ElseBlock extends ScopedBlock {
    constructor({indent} = {}){
        super({indent})
        this._lines.unshift(this.indent({value: `else{`}))
        this._lines.push(this.indent({value: `}`}))
        this.setIndent(this._indent + 1)
    }
}
