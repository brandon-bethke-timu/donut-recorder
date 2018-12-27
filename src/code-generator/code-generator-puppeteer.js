import messageActions from './message-actions'
import Block from './block/block'
import AfterBlock from './block/after-block'
import ItBlock from './block/it-block'
import AsyncBlock from './block/async-block'
import DescribeBlock from './block/describe-block'
import BaseHandler from './base-handler'
import GetStringBlock from './block/get-string-block'
import GetIntBlock from './block/get-int-block'
import MethodBlock from './block/method-block'
import IfBlock from "./block/if-block"
import Variable from "./block/variable"
import Line from "./block/line"
import {global} from './global-settings'

export const options = [
    { type: "checkbox", name: "mocha", title: "in mocha test format", value: false, id: "mocha"},
    { type: "checkbox", name: "headless", title: "headless", value: false, id: "headless"},
    { type: "textbox", name: "typingDelay", title: "The delay between keystrokes", value: 100, id: "typingDelay"}
]

class KeyDownHandler extends BaseHandler {
    handle(block, events, current){
        let { key, keyCode, target, comment } = events[current]
        if(comment){
            block.add(`// ${comment}`)
        }
        const selector = target.selector;
        if (keyCode == 16 || keyCode == 17 || keyCode == 18) {
        } else {
            block.add(`await type('${selector}', '${key}', true)`)
        }
    }
}

class WaitForSelectorHandler extends BaseHandler {
    handle(block, events, current){
        let { target, comment } = events[current]
        if(comment){
            block.add(`// ${comment}`)
        }
        const selector = target.selector;
        block.add(`await page.waitFor('${selector}', {visible: true})`)
    }
}

class WaitForTextHandler extends BaseHandler {
    handle(block, events, current){
        let { target, comment } = events[current]
        if(comment){
            block.add(`// ${comment}`)
        }
        const tagName = target.tagName;
        let innerText = target.innerText;
        const isExpression = this.isExpression(innerText)
        innerText = this.format(innerText)
        if(isExpression){
            block.add(`await page.waitFor("//${tagName}[normalize-space() = \" + ${innerText} + \"]", {visible: true})`)
        } else {
            block.add(`await page.waitFor("//${tagName}[normalize-space() = ${innerText}]", {visible: true})`)
        }
    }
}

class ClickTextHandler extends BaseHandler {
    handle(block, events, current){
        let { target, comment } = events[current]
        if(comment){
            block.add(`// ${comment}`)
        }
        const tagName = target.tagName;
        let innerText = target.innerText;
        const isExpression = this.isExpression(innerText)
        innerText = this.format(innerText)
        if(isExpression){
            block.add(`await click("//${tagName}[normalize-space() = \" + ${innerText} + \"]")`)
        } else {
            block.add(`await click("//${tagName}[normalize-space() = ${innerText}]")`)
        }
    }
}

class TypeTextHandler extends BaseHandler {
    handle(block, events, current){
        let { value, target, clear } = events[current]
        if(comment){
            block.add(`// ${comment}`)
        }
        const selector = target.selector;
        value = this.format(value);
        if(clear){
            block.add(`const inputValue = await page.$eval('${selector}', el => el.value);`)
            block.add(`for (let i = 0; i < inputValue.length; i++) {`)
            block.add(`  await page.press('Backspace')`)
            block.add(`}`)
        }
        block.add(`await type('${selector}', ${value})`)
    }
}

class MouseDownHandler extends BaseHandler {
    handle(block, events, current){
        let { target, comment } = events[current]
        if(comment){
            block.add(`// ${comment}`)
        }
        const selector = target.selector;
        block.add(`await click('${selector}')`)
    }
}

class ChangeHandler extends BaseHandler {
    handle(block, events, current){
        let { value, target} = events[current]
        if(comment){
            block.add(`// ${comment}`)
        }
        const selector = target.selector;
        if(target.tagName === "SELECT"){
            block.add(`await page.select('${selector}', '${value}')`)
        }
    }
}

class WaitHandler extends BaseHandler {
    handle(block, events, current){
        let { value, comment } = events[current]
        if(comment){
            block.add(`// ${comment}`)
        }
        block.add(`await page.waitFor(${value});`)
    }
}

class GotoHandler extends BaseHandler {
    handle(block, events, current){
        let { value, setLocalStorage, comment } = events[current]
        if(comment){
            block.add(`// ${comment}`)
        }
        value = this.format(value)
        block.add(`await page.goto(${value})`)
        if(setLocalStorage){
            block.add(`setLocalStorage()`)
        }
    }
}

class ViewportHandler extends BaseHandler {
    handle(block, events, current){
        let { value, comment } = events[current]
        if(comment){
            block.add(`// ${comment}`)
        }
        block.add(`await page.setViewport({ width: ${value.width}, height: ${value.height} })`)
    }
}

class VariableHandler extends BaseHandler {
    handle(block, events, current){
        let { name, value, comment } = events[current]
        if(comment){
            block.add(`// ${comment}`)
        }
        value = this.format(value)
        block.add(`let ${name} = ${value}`)
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
    let block = new Block({indent: 0})
    this.addImports(block)
    let body = block;
    block.add(``)
    if(!this._options.mocha){
        body = new AsyncBlock();
        block.add(body)
    }
    this.addGlobalVariables(body)
    body.add(``)
    this.addGlobalMethods(body)
    body.add(``)

    if(this._options.mocha){
        let describe = new DescribeBlock()
        body.add(describe)
        let it = new ItBlock()
        describe.add(``)
        describe.add(it)
        this.addSetup(it)
        this.addEvents(it, events)
        let after = new AfterBlock();
        after.add(`browser.close()`)
        describe.add(``)
        describe.add(after)
    } else {
        this.addSetup(body)
        this.addEvents(body, events)
        body.add(`browser.close()`)
    }
    return block.build()
  }

  addImports(block){
    block.add(`import puppeteer from 'puppeteer';`)
  }

  addGlobalVariables(block){
      block.add(new Variable({name: "browser"}))
      block.add(new Variable({name: "page"}))
  }

  addGlobalMethods(block){
    let method = new MethodBlock({name: "click"})
    method.add(`let e = await page.waitFor(path, {visible: true})`)
    method.add(`await e.click()`)
    block.add(method)
    block.add('')

    method = new MethodBlock({name: "type", params: ["path", "message", "press"]})
    method.add(`let e = await page.waitFor(path, {visible: true})`)
    let ifBlock = new IfBlock({condition: "press"})
    ifBlock.add(`await e.press(message)`)
    let elseBlock = ifBlock.else();
    elseBlock.add(`await e.type(message, {delay: ${this._options.typingDelay}})`)
    method.add(ifBlock)
    block.add(method)
    block.add('')

    let getIntBlock = new GetIntBlock();
    block.add(getIntBlock)

    let getStringBlock = new GetStringBlock();
    block.add(getStringBlock)

    var storage = JSON.parse(this._options.localStorage)
    if(Object.keys(storage).length > 0){
      block.add(``)
      let method = new MethodBlock({name: "setLocalStorage"})
      method.add(`await page.evaluate(() => {`)
      for (var key in storage) {
        var keyValue = storage[key]
        if(typeof(keyValue) === "object"){
            keyValue = JSON.stringify(keyValue);
            method.add(`  localStorage.setItem("${key}", JSON.stringify(${keyValue}))`)
        } else {
            method.add(`  localStorage.setItem("${key}", "${keyValue}")`)
        }
      }
      method.add(`})`)
      block.add(method)
    }
  }

  addSetup(block){
    block.add(`browser = await puppeteer.launch( {headless: ${this._options.headless}} )`)
    block.add(`page = await browser.newPage()`)

    var cookies = JSON.parse(this._options.cookies)
    for (var key in cookies) {
      var keyValue = JSON.stringify(cookies[key])
      block.add(`await page.setCookie(${keyValue})`)
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
