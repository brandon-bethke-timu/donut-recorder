import ScopedBlock from './scoped-block'
import Line from "./line"
export default class AfterBlock extends ScopedBlock {
    constructor({indent, async} = {}){
        super({indent})
        this.async = async === undefined ? true : async
    }

    build(){
        if(this.async){
            this._lines.unshift(new Line({indent: this.getIndent(), value: `after(async function(){`}))
        } else {
            this._lines.unshift(new Line({indent: this.getIndent(), value: `after(function(){`}))
        }
        this._lines.push(new Line({indent: this.getIndent(), value: `})`}))
        return super.build();
    }
}
