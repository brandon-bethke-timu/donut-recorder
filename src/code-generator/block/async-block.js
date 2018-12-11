import IndentedBlock from './indented-block'
import Line from "./line"

export default class AsyncBlock extends IndentedBlock {
    constructor({indent} = {}){
        super({indent})
    }

    build(){
        this._lines.unshift(new Line({indent: this.getIndent(), value: `(async() =>{`}))
        this._lines.push(new Line({indent: this.getIndent(), value: `})()`}))
        return super.build();
    }
}
