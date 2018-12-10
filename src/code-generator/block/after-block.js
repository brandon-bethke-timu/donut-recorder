import ScopedBlock from './scoped-block'
export default class AfterBlock extends ScopedBlock {
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
}
