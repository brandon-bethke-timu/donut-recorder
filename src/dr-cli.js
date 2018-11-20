import {CodeGeneratorPuppeteer} from './code-generator/code-generator-puppeteer'
import {CodeGeneratorCypress} from './code-generator/code-generator-cypress'
import { global } from './code-generator/global-settings'
import yaml from 'js-yaml'
import fs from 'fs'
import flags from 'flags'
import path from 'path'

try {

    flags.defineString('type', 'puppeteer', 'The code generator')
    flags.defineString('file', 'il.yaml', 'The input yaml')
    flags.defineString('out', '', 'The output file')
    flags.defineString('opt', 'options.json', 'Options file')
    flags.parse();

    let input = flags.get('file')
    let out = flags.get('out')
    if(out == ''){
        out = path.parse(input).name
    }

    let options = JSON.parse(fs.readFileSync(flags.get('opt'), 'utf8'));
    options = Object.assign(global, options);

    let il = yaml.safeLoad(fs.readFileSync(input, 'utf8'));
    let generator = undefined;
    let type = flags.get('type');
    if(type === 'cypress'){
       generator = new CodeGeneratorCypress(options)
    } else if(type === 'puppeteer'){
       generator = new CodeGeneratorPuppeteer(options)
    }
    if(generator === undefined){
        console.log("A valid code generator type must be specified")
        exit(1)
    }
    let code = generator.generate(il.actions)
    fs.writeFileSync(out + "." + generator.language, code);

} catch (e) {
    console.log(e);
}
