import ScopedBlock from './scoped-block'
import Line from "./line"

export default class DescribeBlock extends ScopedBlock {
    constructor({name, indent, async} = {}){
        super({indent})
        this.name = name ? name : ""
        async = async === undefined ? true : async
    }

    build(){
        if(this.async){
            this._lines.unshift(new Line({indent: this.getIndent(), value: `describe("${this.name}", async function(){`}))
        } else {
            this._lines.unshift(new Line({indent: this.getIndent(), value: `describe("${this.name}", function(){`}))
        }
        this._lines.push(new Line({indent: this.getIndent(), value: `})`}))
        return super.build();
    }
}
