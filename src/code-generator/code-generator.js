import {CodeGeneratorCypress} from './code-generator-cypress'
import {CodeGeneratorPuppeteer} from './code-generator-puppeteer'
import {CodeGeneratorIL} from './code-generator-il'
import {CodeGeneratorPptrMocha} from './code-generator-pptr-mocha'

const generators = {
    active: "CodeGeneratorCypress",
    types: [
        {id: 'CodeGeneratorIL', title: 'IL Generator', options: [] },
        {id: 'CodeGeneratorCypress', title: 'Cypress Generator', options: [] },
        {id: 'CodeGeneratorPuppeteer', title: 'Puppeteer Generator', options: [] },
        {id: 'CodeGeneratorPptrMocha', title: 'Puppeteer Mocha Generator', options: [] }
    ]
}

const classes = {
    CodeGeneratorCypress,
    CodeGeneratorPuppeteer,
    CodeGeneratorIL,
    CodeGeneratorPptrMocha
}

class CodeGenerator {
    constructor(name, options){
        return new classes[name](options);
    }
}

export {generators, CodeGenerator}