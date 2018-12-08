import messageActions from './message-actions'
import Block from './block/block'
import DescribeBlock from './block/describe-block'
import GetStringBlock from './block/get-string-block'
import BaseHandler from './base-handler'
import {global} from './global-settings'
//import {details as eventToString} from 'key-event-to-string'

export const options = [
    { type: "checkbox", name: "ignoreUncaughtExceptions", title: "Ignore uncaught exceptions", value: false, id: "ignoreUncaughtExceptions"},
    { type: "textbox", name: "typingDelay", title: "The delay between keystrokes", value: 100, id: "typingDelay"}
]

class KeyDownHandler extends BaseHandler {
    handle(block, events, current){
        let { key, keyCode, target } = events[current]
        const selector = target.selector;
        if (keyCode == 16 || keyCode == 17 || keyCode == 18) {
        } else if (keyCode == 13) {
            block.addLine({value: `cy.get('${selector}').type('{enter}', {delay: ${this.options.typingDelay}})`})
        } else {
            key = this.format(key)
            block.addLine({value: `cy.get('${selector}').type('${key}', {delay: ${this.options.typingDelay}})`})
        }
    }
}

class WaitForSelectorHandler extends BaseHandler {
    handle(block, events, current){
        let { target } = events[current]
        const selector = target.selector;
        block.addLine({ value: `cy.get('${selector}').should('be.visible')` })
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
            block.addLine({ value: `cy.get("${tagName}:contains(\" + ${innerText} + \")").should('be.visible')`})
        } else {
            block.addLine({ value: `cy.get("${tagName}:contains(${innerText})").should('be.visible')`})
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
            block.addLine({ value: `cy.get("${tagName}:contains(\" + ${innerText} + \")").click()`})
        } else {
            block.addLine({ value: `cy.get("${tagName}:contains(${innerText})").click()`})
        }
    }
}

class TypeTextHandler extends BaseHandler {
    handle(block, events, current){
        let { value, target} = events[current]
        const selector = target.selector;
        value = this.format(value);
        block.addLine({ value: `cy.get('${selector}').type(${value}, {delay: ${this.options.typingDelay}})` })
    }
}

class MouseDownHandler extends BaseHandler {
    handle(block, events, current){
        let { target } = events[current]
        const selector = target.selector;
        block.addLine({ value: `cy.get("${selector}").click()`})
    }
}

class ChangeHandler extends BaseHandler {
    handle(block, events, current){
        let { value, target} = events[current]
        const selector = target.selector;
        if(target.tagName === "SELECT"){
            block.addLine({ value: `cy.get('${selector}').select('${value}')` })
        }
    }
}

class WaitHandler extends BaseHandler {
    handle(block, events, current){
        let { value } = events[current]
        block.addLine({ value: `cy.wait(${value});`})
    }
}

class GotoHandler extends BaseHandler {
    handle(block, events, current){
        let { value } = events[current]
        value = this.format(value)
        block.addLine({ value: `cy.visit(${value})` })
    }
}

class VariableHandler extends BaseHandler {
    handle(block, events, current){
        let { name, value } = events[current]
        value = this.format(value)
        block.addLine({value: `let ${name} = ${value}`})
    }
}

export class CodeGeneratorCypress {
  constructor (options) {
    this.options = Object.assign(global, options)
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
  }

  generate (events) {
    let block = new Block()

    this.addImports(block)
    //block.addLine({value: ''})
    this.addGlobalVariables(block)
    //block.addLine({value: ''})
    this.addGlobalMethods(block)
    block.addLine({value: ''})
    let describe = new DescribeBlock({indent: 0})
    this.addSetup(describe)
    this.addEvents(describe, events)
    block.addBlock(describe)
    this.addUncaughtException(block)

    return block.build()
  }

  addUncaughtException(block){
    if(this.options.ignoreUncaughtExceptions){
        block.addLine({value: `Cypress.on('uncaught:exception', (err, runnable) => {`})
        block.addLine({value: `  return false`})
        block.addLine({value: `})`})
    }
  }

  addImports(block){
    //block.addLine({value: `import xxx from 'xxx';`})
  }

  addGlobalVariables(block){
    //Example
    //block.addLine({value: `let xxx = {};`})
  }

  addGlobalMethods(block){

    let getStringBlock = new GetStringBlock({indent: block.getIndent()});
    block.addBlock(getStringBlock)
    const storage = JSON.parse(this.options.localStorage)
    if(Object.keys(storage).length > 0){
        block.addLine({value: ``})
        block.addLine({value: `let setLocalStorage = function(){`})
        for (let key in storage) {
            let keyValue = storage[key]
            if(typeof(keyValue) === "object"){
                keyValue = JSON.stringify(keyValue);
                block.addLine({ value: `  localStorage.setItem("${key}", JSON.stringify(${keyValue}))`})
            } else {
                block.addLine({ value: `  localStorage.setItem("${key}", "${keyValue}")`})
            }
        }
        block.addLine({value: `}`})
    }
  }

  addSetup(block){
    let cookies = JSON.parse(this.options.cookies)
    for (var key in cookies) {
      let keyValue = JSON.stringify(cookies[key])
      let cookieOptions = JSON.parse(keyValue)
      let name = cookies[key].name;
      let value = cookies[key].value;
      delete cookieOptions.name;
      delete cookieOptions.value;
      cookieOptions = JSON.stringify(cookieOptions);
      block.addLine({value: `cy.setCookie("${name}", "${value}", ${cookieOptions})`})
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
