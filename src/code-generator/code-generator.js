import {CodeGeneratorCypress} from './code-generator-cypress'
import {CodeGeneratorPuppeteer, options as pptrOptions} from './code-generator-puppeteer'
import {CodeGeneratorIL} from './code-generator-il'
import {CodeGeneratorPptrMocha, options as pptrMochaOptions} from './code-generator-pptr-mocha'

const generators = {
    active: "CodeGeneratorCypress",
    types: [
        {id: 'CodeGeneratorIL', title: 'IL Generator', options: [] },
        {id: 'CodeGeneratorCypress', title: 'Cypress Generator', options: [] },
        {id: 'CodeGeneratorPuppeteer', title: 'Puppeteer Generator', options: pptrOptions },
        {id: 'CodeGeneratorPptrMocha', title: 'Puppeteer Mocha Generator', options: pptrMochaOptions }
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