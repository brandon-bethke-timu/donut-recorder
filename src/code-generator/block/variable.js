import Line from './line'

export default class Variable extends Line {
    constructor({indent, name, value, terminator, newline} = {}){
        super({indent, terminator, newline})
        if(value){
            this.line = `let ${name} = '${value}'`
        } else {
            this.line = `let ${name} = undefined`
        }
    }
}
