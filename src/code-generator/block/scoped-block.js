import Block from './block'
import Line from './line'

export default class ScopedBlock extends Block {
    add (item) {
        if(typeof(item) === "string"){
            this._lines.push(new Line({indent: this.getIndent() + 1, value: item}))
        } else {
            if(item.getIndent() === undefined){
                item.setIndent(this.getIndent() + 1)
            }
            super.add(item)
        }
    }
}
