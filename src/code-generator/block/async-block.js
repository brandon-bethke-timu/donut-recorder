import Block from './block'
export default class AsyncBlock extends Block {
    constructor({indent} = {}){
        super({indent})
        this._lines.unshift(this.indent({value: `(async() =>{`}))
        this._lines.push(this.indent({value: `})()`}))
        this.setIndent(this._indent + 1)
    }
    addLine (line) {
        this._lines.splice(this._lines.length - 1, 0, this.indent(line))
    }
    addBlock(block){
        this._lines.splice(this._lines.length - 1, 0, block)
    }
}
