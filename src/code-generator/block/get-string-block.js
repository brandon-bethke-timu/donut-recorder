import Block from './block'
export default class GetStringBlock extends Block {
    constructor({indent} = {}){
        super({indent})
        this.add(`const getString = function(){`)
        this.add(`  return Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 10)`)
        this.add(`}`)
    }
}
