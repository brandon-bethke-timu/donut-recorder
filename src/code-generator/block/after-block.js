import Block from "./block"
export default class AfterBlock extends Block {
    constructor({indent, async} = {}){
        super({indent})
        async = async === undefined ? true : async
        if(async){
            this._lines.unshift(this.indent({value: `after(async function(){`}))
        } else {
            this._lines.unshift(this.indent({value: `after(function(){`}))
        }
        this._lines.push(this.indent({value: `})`}))
        this.setIndent(this._indent + 1)
    }
    addLine (line) {
        this._lines.splice(this._lines.length - 1, 0, this.indent(line))
    }
    addBlock(block){
        this._lines.splice(this._lines.length - 1, 0, block)
    }
}
