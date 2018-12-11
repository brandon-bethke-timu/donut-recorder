import IndentedBlock from './indented-block'
import Line from "./line"
export default class MethodBlock extends IndentedBlock {
    constructor({indent, async, name, params} = {}){
        super({indent})
        this.async = async === undefined ? true : async
        this.name = name
        this.params = params
    }

    build(){
        let methodParams = ""
        if(this.params){
            methodParams = this.params.join(", ")
        }
        if(this.async){
            this._lines.unshift(new Line({indent: this.getIndent(), value: `const ${this.name} = async function(${methodParams}){`}))
        } else {
            this._lines.unshift(new Line({indent: this.getIndent(), value: `const ${this.name} = function(${methodParams}){`}))
        }
        this._lines.push(new Line({indent: this.getIndent(), value: `})`}))
        return super.build();
    }
}
