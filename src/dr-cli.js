import {CodeGeneratorPuppeteer} from './code-generator/code-generator-puppeteer'
import {CodeGeneratorCypress} from './code-generator/code-generator-cypress'
import { global } from './code-generator/global-settings'
import yaml from 'js-yaml'
import fs from 'fs'
import flags from 'flags'

try {

    flags.defineString('code', 'puppeteer', 'The code generator')
    flags.defineString('file', 'il.yaml', 'The input yaml')
    flags.defineString('output', 'result.js', 'The output file')
    flags.defineString('options', 'options.json', 'Options file')
    flags.parse();

    let codeOption = flags.get('code');

    let options = JSON.parse(fs.readFileSync(flags.get('options'), 'utf8'));
    options = Object.assign(global, options);

    let il = yaml.safeLoad(fs.readFileSync(flags.get('file'), 'utf8'));
    let generator = undefined;
    if(codeOption === 'cypress'){
       generator = new CodeGeneratorCypress(options)
    } else if(codeOption === 'puppeteer'){
       generator = new CodeGeneratorPuppeteer(options)
    }
    let code = generator.generate(il.actions)
    fs.writeFileSync(flags.get('output'), code);

} catch (e) {
    console.log(e);
}
