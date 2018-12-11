import Block from './block'
import Line from './line'

export default class IndentedBlock extends Block {
    build() {
        let lines = this.getLines();
        let total = lines.length;
        for(let i = 0; i < total; i++){
            let item = lines[i];
            if(item.getIndent() === undefined){
                item.setIndent(this.getIndent() + 1);
            }
        }
        return super.build()
    }
}
