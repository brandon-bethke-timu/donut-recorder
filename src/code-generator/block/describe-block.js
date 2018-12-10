import ScopedBlock from './scoped-block'
export default class DescribeBlock extends ScopedBlock {
    constructor({indent, async} = {}){
        super({indent})
        async = async === undefined ? true : async
        if(async){
            this._lines.unshift(this.indent({value: `describe("", async function(){`}))
        } else {
            this._lines.unshift(this.indent({value: `describe("", function(){`}))
        }
        this._lines.push(this.indent({value: `})`}))
        this.setIndent(this._indent + 1)
    }
}
