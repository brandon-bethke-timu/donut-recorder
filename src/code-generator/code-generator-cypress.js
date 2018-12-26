import messageActions from './message-actions'
import Block from './block/block'
import DescribeBlock from './block/describe-block'
import ItBlock from './block/it-block'
import GetStringBlock from './block/get-string-block'
import BaseHandler from './base-handler'
import MethodBlock from './block/method-block'
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
            block.add(`cy.get('${selector}').type('{enter}', {force: true, delay: ${this.options.typingDelay}})`)
        } else {
            block.add(`cy.get('${selector}').type('${key}', {force: true, delay: ${this.options.typingDelay}})`)
        }
    }
}

class WaitForSelectorHandler extends BaseHandler {
    handle(block, events, current){
        let { target } = events[current]
        const selector = target.selector;
        block.add(`cy.get('${selector}').should('be.visible')`)
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
            block.add(`cy.get("${tagName}:contains(\" + ${innerText} + \")").should('be.visible')`)
        } else {
            block.add(`cy.get("${tagName}:contains(${innerText})").should('be.visible')`)
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
            block.add(`cy.get("${tagName}:contains(\" + ${innerText} + \")").click({force: true})`)
        } else {
            block.add(`cy.get("${tagName}:contains(${innerText})").click({force: true})`)
        }
    }
}

class TypeTextHandler extends BaseHandler {
    handle(block, events, current){
        let { value, target, clear } = events[current]
        const selector = target.selector;
        value = this.format(value);
        if(clear){
            block.add(`cy.get('${selector}').clear({force: true})`)
        }
        block.add(`cy.get('${selector}').type(${value}, {force: true, delay: ${this.options.typingDelay}})`)
    }
}

class MouseDownHandler extends BaseHandler {
    handle(block, events, current){
        let { target } = events[current]
        const selector = target.selector;
        block.add(`cy.get("${selector}").click({force: true})`)
    }
}

class ChangeHandler extends BaseHandler {
    handle(block, events, current){
        let { value, target} = events[current]
        const selector = target.selector;
        if(target.tagName === "SELECT"){
            block.add(`cy.get('${selector}').select('${value}')`)
        }
    }
}

class WaitHandler extends BaseHandler {
    handle(block, events, current){
        let { value } = events[current]
        block.add(`cy.wait(${value})`)
    }
}

class GotoHandler extends BaseHandler {
    handle(block, events, current){
        let { value, setLocalStorage } = events[current]
        value = this.format(value)
        block.add(`cy.visit(${value})`)
        if(setLocalStorage){
            block.add(`setLocalStorage()`)
        }
    }
}

class VariableHandler extends BaseHandler {
    handle(block, events, current){
        let { name, value } = events[current]
        value = this.format(value)
        block.add(`let ${name} = ${value}`)
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
    let block = new Block({indent: 0})

    this.addImports(block)
    //block.add('')
    this.addGlobalVariables(block)
    //block.add('')
    this.addGlobalMethods(block)
    block.add('')
    let describe = new DescribeBlock({async: false})
    let it = new ItBlock({async: false})
    describe.add(``)
    describe.add(it)
    this.addSetup(it)
    this.addEvents(it, events)
    block.add(describe)
    this.addUncaughtException(block)

    return block.build()
  }

  addUncaughtException(block){
    if(this.options.ignoreUncaughtExceptions){
        block.add(`Cypress.on('uncaught:exception', (err, runnable) => {`)
        block.add(`  return false`)
        block.add(`})`)
    }
  }

  addImports(block){
    //block.add(`import xxx from 'xxx';`)
  }

  addGlobalVariables(block){
    //Example
    //block.add(`let xxx = {};`)
  }

  addGlobalMethods(block){

    let getStringBlock = new GetStringBlock();
    block.add(getStringBlock)
    const storage = JSON.parse(this.options.localStorage)
    if(Object.keys(storage).length > 0){
        block.add(``)
        let method = new MethodBlock({name: "setLocalStorage", async: false})
        for (let key in storage) {
            let keyValue = storage[key]
            if(typeof(keyValue) === "object"){
                keyValue = JSON.stringify(keyValue);
                method.add(`localStorage.setItem("${key}", JSON.stringify(${keyValue}))`)
            } else {
                method.add(`localStorage.setItem("${key}", "${keyValue}")`)
            }
        }
        block.add(method)
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
      block.add(`cy.setCookie("${name}", "${value}", ${cookieOptions})`)
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
