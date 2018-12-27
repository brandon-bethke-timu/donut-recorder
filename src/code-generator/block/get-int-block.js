import Block from './block'
export default class GetIntBlock extends Block {
    constructor({indent} = {}){
        super({indent})
        this.add(`const getInt = function(){`)
        this.add(`  return Math.floor(Math.random() * 10000)`)
        this.add(`}`)
    }
}
