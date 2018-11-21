import messageActions from './message-actions'
import Block from './block'
import {global} from './global-settings'
//import {details as eventToString} from 'key-event-to-string'

export const options = [
    { type: "checkbox", name: "ignoreUncaughtExceptions", title: "Ignore uncaught exceptions", value: false, id: "ignoreUncaughtExceptions"},
    { type: "textbox", name: "typingDelay", title: "The delay between keystrokes", value: 100, id: "typingDelay"}
]

const newLine = '\n';

class BaseHandler {
    constructor(options){
        this.options = options
    }

    format(expression){
      if(!expression) return expression;

      if(expression.match(/^['].*[']$/)){
        return expression
      }

      if(expression.match(/^["].*["]$/)){
        return expression
      }

      let isExpression = false
      isExpression = isExpression || expression.match(/\{\{([A-Za-z0-9]*)\}\}/)
      isExpression = isExpression || expression.match(/getString\(\)/)
      let temp = expression.replace(/\{\{([A-Za-z0-9]*)\}\}/, "$1")
      if(isExpression){
        return temp
      }
      return `'${temp}'`
    }

    getPreviousEvent(events, index){
      for(let i = index - 1; i >=0 ; i--) {
        let previousEvent = events[i]
        if(previousEvent.action === "mousemove"){
          continue;
        }
        return previousEvent;
      }
      return undefined;
    }

    getNextEvent(events, index){
      for(let i = index + 1; i < events.length; i++) {
        let nextEvent = events[i]
        if(nextEvent.action === "mousemove"){
          continue;
        }
        return nextEvent;
      }
      return undefined;
    }
}

class KeyDownHandler extends BaseHandler {
    handle(block, events, current){
        let { key, target } = events[current]
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
        innerText = this.format(innerText)
        block.addLine({ value: `cy.get("${tagName}:contains(${innerText})").should('be.visible')`})
    }
}

class ClickTextHandler extends BaseHandler {
    handle(block, events, current){
        let { target } = events[current]
        const tagName = target.tagName;
        let innerText = target.innerText;
        innerText = this.format(innerText)
        block.addLine({ value: `cy.get("${tagName}:contains(${innerText})").click()`})
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

class SetLocalStorageHandler extends BaseHandler {
    handle(block, events, current){
        const storage = JSON.parse(this.options.localStorage)
        if(Object.keys(storage).length > 0){
          for (let key in storage) {
            let keyValue = storage[key]
            block.addLine({ value: `localStorage.setItem("${key}", "${keyValue}")`})
          }
        }
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
    this.handlers['set-local-storage*'] = new SetLocalStorageHandler(this.options);
    this.handlers['goto*'] = new GotoHandler(this.options);
    this.handlers['variable*'] = new VariableHandler(this.options);
  }

  generate (events) {
    let block = new Block(this._frameId, 0)

    this.addImports(block)
    block.addLine({value: ''})
    this.addGlobalVariables(block)
    block.addLine({value: ''})
    this.addGlobalMethods(block)
    block.addLine({value: ''})
    block.addLine({value: `describe("", async function(){`})
    block.addLine({value: `  it("", async function(){`})
    block.setIndent(2)
    this.addSetup(block)
    this.addEvents(block, events)
    block.setIndent(0)
    block.addLine({value: `  })`})
    block.addLine({value: `})`})
    this.addUncaughtException(block)

    const lines = block.getLines()
    let script = ''
    for (let line of lines) {
      script = script + line.value + newLine
    }

    return script;
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
    block.addLine({value: `let getString = function(){`})
    block.addLine({value: `  return Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 10)`})
    block.addLine({value: `}`})
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

  addBlock(block){
    this._blocks.push(block)
  }

  addEvents (block, events) {
    for (let i = 0; i < events.length; i++) {
      const handler = this.handlers[action];
      if(handler){
          handler.handle(block, events, i);
      }
    }
  }
}
