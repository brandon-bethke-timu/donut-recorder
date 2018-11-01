import {CodeGeneratorCypress} from './code-generator-cypress'
import {CodeGeneratorPuppeteer, options as pptrOptions} from './code-generator-puppeteer'
import {CodeGeneratorYaml} from './code-generator-yaml'

const generators = {
    active: "CodeGeneratorCypress",
    types: [
        {id: 'CodeGeneratorYaml', title: 'Yaml Generator', options: [] },
        {id: 'CodeGeneratorCypress', title: 'Cypress Generator', options: [] },
        {id: 'CodeGeneratorPuppeteer', title: 'Puppeteer Generator', options: pptrOptions }
    ]
}

const classes = {
    CodeGeneratorCypress,
    CodeGeneratorPuppeteer,
    CodeGeneratorYaml
}

class CodeGenerator {
    constructor(name, options){
        return new classes[name](options);
    }
}

export {generators, CodeGenerator}