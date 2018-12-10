import Block from './block'

export default class ScopedBlock extends Block {
    addLine (line) {
        this._lines.splice(this._lines.length - 1, 0, this.indent(line))
    }
    addBlock(block){
        this._lines.splice(this._lines.length - 1, 0, block)
    }

    addBlockAfterScope(block){
        this._lines.push(block);
    }
}
