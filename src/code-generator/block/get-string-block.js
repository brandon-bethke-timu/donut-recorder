import Block from './block'
export default class GetStringBlock extends Block {
    constructor({indent}){
        super({indent})
        this.addLine({value: `const getString = function(){`})
        this.addLine({value: `  return Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 10)`})
        this.addLine({value: `}`})
    }
}
