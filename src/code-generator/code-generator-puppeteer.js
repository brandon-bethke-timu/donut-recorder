import messageActions from './message-actions'
import Block from './block'
import {BaseHandler} from './base-handler'
import {global} from './global-settings'

export const options = [
    { type: "checkbox", name: "mocha", title: "in mocha test format", value: false, id: "mocha"},
    { type: "checkbox", name: "headless", title: "headless", value: false, id: "headless"},
    { type: "textbox", name: "typingDelay", title: "The delay between keystrokes", value: 100, id: "typingDelay"}
]

const newLine = '\n';

class KeyDownHandler extends BaseHandler {
    handle(block, events, current){
        let { key, keyCode, target } = events[current]
        const selector = target.selector;
        if (keyCode == 16 || keyCode == 17 || keyCode == 18) {
        } else {
            block.addLine({value: `await type('${selector}', '${key}', true)`})
        }
    }
}

class WaitForSelectorHandler extends BaseHandler {
    handle(block, events, current){
        let { target } = events[current]
        const selector = target.selector;
        block.addLine({ value: `await page.waitFor('${selector}', {visible: true})` })
    }
}

class WaitForTextHandler extends BaseHandler {
    handle(block, events, current){
        let { target } = events[current]
        const tagName = target.tagName;
        let innerText = target.innerText;
        const isExpression = this.isExpression(innerText)
        innerText = this.format(innerText)
        if(isExpression){
            block.addLine({ value: `await page.waitFor("//${tagName}[normalize-space() = \" + ${innerText} + \"]", {visible: true})`})
        } else {
            block.addLine({ value: `await page.waitFor("//${tagName}[normalize-space() = ${innerText}]", {visible: true})`})
        }
    }
}

class ClickTextHandler extends BaseHandler {
    handle(block, events, current){
        let { target } = events[current]
        const tagName = target.tagName;
        let innerText = target.innerText;
        const isExpression = this.isExpression(innerText)
        innerText = this.format(innerText)
        if(isExpression){
            block.addLine({ value: `await click("//${tagName}[normalize-space() = \" + ${innerText} + \"]")`})
        } else {
            block.addLine({ value: `await click("//${tagName}[normalize-space() = ${innerText}]")`})
        }
    }
}

class TypeTextHandler extends BaseHandler {
    handle(block, events, current){
        let { value, target} = events[current]
        const selector = target.selector;
        value = this.format(value);
        block.addLine({ value: `await type('${selector}', ${value})` })
    }
}

class MouseDownHandler extends BaseHandler {
    handle(block, events, current){
        let { target } = events[current]
        const selector = target.selector;
        block.addLine({ value: `await click('${selector}')`})
    }
}

class ChangeHandler extends BaseHandler {
    handle(block, events, current){
        let { value, target} = events[current]
        const selector = target.selector;
        if(target.tagName === "SELECT"){
            block.addLine({ value: `await page.select('${selector}', '${value}')` })
        }
    }
}

class WaitHandler extends BaseHandler {
    handle(block, events, current){
        let { value } = events[current]
        block.addLine({ value: `await page.waitFor(${value});`})
    }
}

class GotoHandler extends BaseHandler {
    handle(block, events, current){
        let { value } = events[current]
        value = this.format(value)
        block.addLine({ value: `await page.goto(${value})` })
    }
}

class ViewportHandler extends BaseHandler {
    handle(block, events, current){
        let { value } = events[current]
        block.addLine({ value: `await $page.setViewport({ width: ${value.width}, height: ${value.height} })` })
    }
}

class VariableHandler extends BaseHandler {
    handle(block, events, current){
        let { name, value } = events[current]
        value = this.format(value)
        block.addLine({value: `let ${name} = ${value}`})
    }
}

export class CodeGeneratorPuppeteer {
  constructor (options) {
    this._options = Object.assign(global, options)
    this.language = "js"

    this.handlers = []
    this.handlers['keydown'] = new KeyDownHandler(this.options);
    this.handlers['wait-for-selector*'] = new WaitForSelectorHandler(this.options);
    this.handlers['wait-for-text*'] = new WaitForTextHandler(this.options);
    this.handlers['click-text*'] = new ClickTextHandler(this.options);
    this.handlers['type-text*'] = new TypeTextHandler(this.options);
    this.handlers['mousedown'] = new MouseDownHandler(this.options);
    this.handlers['change'] = new ChangeHandler(this.options);
    this.handlers['wait*'] = new WaitHandler(this.options);
    this.handlers['goto*'] = new GotoHandler(this.options);
    this.handlers['variable*'] = new VariableHandler(this.options);
    this.handlers['viewport*'] = new ViewportHandler(this.options);
  }

  generate (events) {
    let block = new Block(this._frameId, 0)
    this.addImports(block)
    block.addLine({value: ''})
    this.addGlobalVariables(block)
    block.addLine({value: ''})
    this.addGlobalMethods(block)
    block.addLine({value: ''})
    if(this._options.mocha){
      block.addLine({value: `describe("", async function(){`})
      block.addLine({value: `  it("", async function(){`})
      block.setIndent(2)
    }
    this.addSetup(block)
    this.addEvents(block, events)
    block.setIndent(0)
    if(!this._options.mocha){
        block.addLine({value: `browser.close()`})
    }
    if(this._options.mocha){
        block.setIndent(0)
        block.addLine({value: `  })`})
        block.addLine({value: `  after(async function(){`})
        block.addLine({value: `    browser.close()`})
        block.addLine({value: `  })`})
        block.addLine({value: `})`})
    }

    const lines = block.getLines()
    let script = ''
    for (let line of lines) {
      script = script + line.value + newLine
    }
    return script;
  }

  addImports(block){
    block.addLine({value: `import puppeteer from 'puppeteer';`})
  }

  addGlobalVariables(block){
    block.addLine({value: `let browser = undefined;`})
    block.addLine({value: `let page = undefined;`})
  }

  addGlobalMethods(block){
    block.addLine({value: `const click = async function(path){`})
    block.addLine({value: `  let e = await page.waitFor(path, {visible: true})`})
    block.addLine({value: `  await e.click()`})
    block.addLine({value: `}`})
    block.addLine({value: ''})

    block.addLine({value: `const type = async function(path, message, press){`})
    block.addLine({value: `  let e = await page.waitFor(path, {visible: true})`})
    block.addLine({value: `  if(press){`})
    block.addLine({value: `    await e.press(message)`})
    block.addLine({value: `  } else {`})
    block.addLine({value: `    await e.type(message, {delay: ${this._options.typingDelay}})`})
    block.addLine({value: `  }`})
    block.addLine({value: `}`})
    block.addLine({value: ''})

    block.addLine({value: `const getString = function(){`})
    block.addLine({value: `  return Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 10)`})
    block.addLine({value: `}`})

    var storage = JSON.parse(this._options.localStorage)
    if(Object.keys(storage).length > 0){
      block.addLine({value: ``})
      block.addLine({value: `const setLocalStorage = async function(){`})
      block.addLine({ value: `  await page.evaluate(() => {`})
      for (var key in storage) {
        var keyValue = storage[key]
        if(typeof(keyValue) === "object"){
            keyValue = JSON.stringify(keyValue);
            block.addLine({ value: `    localStorage.setItem("${key}", JSON.stringify(${keyValue}))`})
        } else {
            block.addLine({ value: `    localStorage.setItem("${key}", "${keyValue}")`})
        }
      }
      block.addLine({ value: `  })`})
      block.addLine({ value: `})`})
    }
  }

  addSetup(block){
    block.addLine({value: `browser = await puppeteer.launch( {headless: ${this._options.headless}} );`})
    block.addLine({value: `page = await browser.newPage();`})

    var cookies = JSON.parse(this._options.cookies)
    for (var key in cookies) {
      var keyValue = JSON.stringify(cookies[key])
      block.addLine({value: `await page.setCookie(${keyValue})`})
    }
  }

  addEvents (block, events) {
      for (let i = 0; i < events.length; i++) {
          let {action} = events[i]
          const handler = this.handlers[action];
          if(handler){
              handler.handle(block, events, i);
          }
      }
  }
}
