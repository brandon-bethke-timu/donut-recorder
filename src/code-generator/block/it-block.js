import ScopedBlock from './scoped-block'
export default class ItBlock extends ScopedBlock {
    constructor({indent, async} = {}){
        super({indent})
        async = async === undefined ? true : async
        if(async){
            this._lines.unshift(this.indent({value: `it("", async function(){`}))
        } else {
            this._lines.unshift(this.indent({value: `it("", function(){`}))
        }
        this._lines.push(this.indent({value: `})`}))
        this.setIndent(this._indent + 1)
    }
}
