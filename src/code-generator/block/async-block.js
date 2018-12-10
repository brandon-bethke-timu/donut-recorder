import ScopedBlock from './scoped-block'
export default class AsyncBlock extends ScopedBlock {
    constructor({indent} = {}){
        super({indent})
        this._lines.unshift(this.indent({value: `(async() =>{`}))
        this._lines.push(this.indent({value: `})()`}))
        this.setIndent(this._indent + 1)
    }
}
