import ScopedBlock from './scoped-block'
export default class MethodBlock extends ScopedBlock {
    constructor({indent, async, name, params} = {}){
        super({indent})
        async = async === undefined ? true : async
        let methodParams = ""
        if(params){
            methodParams = params.join(", ")
        }
        if(async){
            this._lines.unshift(this.indent({value: `const ${name} = async function(${methodParams}){`}))
        } else {
            this._lines.unshift(this.indent({value: `const ${name} = function(${methodParams}){`}))
        }
        this._lines.push(this.indent({value: `})`}))
        this.setIndent(this._indent + 1)
    }
}
