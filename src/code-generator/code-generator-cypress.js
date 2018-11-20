import messageActions from './message-actions'
import Block from './block'
import {global} from './global-settings'
//import {details as eventToString} from 'key-event-to-string'

export const options = [
    { type: "checkbox", name: "ignoreUncaughtExceptions", title: "Ignore uncaught exceptions", value: false, id: "ignoreUncaughtExceptions"},
    { type: "textbox", name: "typingDelay", title: "The delay between keystrokes", value: 100, id: "typingDelay"}
]

const newLine = '\n';

export class CodeGeneratorCypress {
  constructor (options) {
    this._options = Object.assign(global, options)
    this._frame = 'page'
    this._frameId = 0
    this._allFrames = {}
    this.language = "js"
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
    if(this._options.ignoreUncaughtExceptions){
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
    let cookies = JSON.parse(this._options.cookies)
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
      const { name, key, value, action, frameId, frameUrl, target, keyCode, altKey, ctrlKey, shiftKey } = events[i]
      // we need to keep a handle on what frames events originate from
      this._setFrames(frameId, frameUrl)

      const getPreviousEvent = function(index){
        for(let i = index - 1; i >=0 ; i--) {
          let previousEvent = events[i]
          if(previousEvent.action === "mousemove"){
            continue;
          }
          return previousEvent;
        }
        return undefined;
      }

      const getNextEvent = function(index){
        for(let i = index + 1; i < events.length; i++) {
          let nextEvent = events[i]
          if(nextEvent.action === "mousemove"){
            continue;
          }
          return nextEvent;
        }
        return undefined;
      }
      const previousEvent = getPreviousEvent(i);
      const nextEvent = getNextEvent(i);

      switch (action) {
        case 'mousemove':
          break

        case 'keydown':
          if (keyCode == 16 || keyCode == 17 || keyCode == 18) {
          } else if (keyCode == 13) {
            this._handleKeyPress(block, target.selector, '{enter}')
          } else {
            this._handleKeyPress(block, target.selector, key)
          }
          break
        case 'wait-for-selector*':
          this._handleWaitFor(block, undefined, target.selector, undefined, undefined)
          break;

        case 'wait-for-text*':
          this._handleWaitFor(block, undefined, undefined, target.tagName, target.innerText)
          break;

        case 'click-text*':
          this._handleClickText(block, undefined, target.tagName, target.innerText)
          break;

        case 'type-text*':
          this._handleKeyDown(block, target.selector, value)
          break;

        case 'mousedown':
          if(nextEvent && nextEvent.action === 'navigation*' && this._options.waitForNavigation && !this._navigationPromiseSet) {
            block.addLine({value: `const navigationPromise = page.waitForNavigation()`})
            this._navigationPromiseSet = true
          }
          this._handleClick(block, target.selector)
          break

        case 'change':
          if (target.tagName === 'SELECT') {
            this._handleChange(block, target.selector, value)
          }
          break

        case 'navigation*':
          this._handleWaitForNavigation(block)
          break

        case 'wait*':
          this._handleAddWait(block, value)
          break

        case 'set-local-storage*':
          this._handleSetLocalStorage(block)
          break

        case 'goto*':
          this._handleGoto(block, value, frameId)
          break

        case 'viewport*':
          //this._handleViewport(block, value.width, value.height)
          break

        case 'variable*':
          this.handleVariable(block, name, value)
          break;
      }
    }
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

  _setFrames (frameId, frameUrl) {
    if (frameId && frameId !== 0) {
      this._frameId = frameId
      this._frame = `frame_${frameId}`
      this._allFrames[frameId] = frameUrl
    } else {
      this._frameId = 0
      this._frame = 'page'
    }
  }

  handleVariable(block, name, value){
    value = this.format(value)
    block.addLine({value: `let ${name} = ${value}`})
  }

  _handleSetLocalStorage(block) {
    var storage = JSON.parse(this._options.localStorage)
    if(Object.keys(storage).length > 0){
      for (var key in storage) {
        var keyValue = storage[key]
        block.addLine({ value: `localStorage.setItem("${key}", "${keyValue}")`})
      }
    }
  }

  _handleAddWait(block, period) {
    block.addLine({ value: `cy.wait(${period});`})
  }

  _handleClickText(block, id, tagName, innerText) {
    innerText = this.format(innerText)
    if(id){
      block.addLine({ value: `cy.get('#${id}').click()`})
    } else {
      block.addLine({ value: `cy.get("${tagName}:contains(${innerText})").click()`})
    }
  }

  _handleWaitFor(block, id, selector, tagName, innerText) {
    innerText = this.format(innerText)
    if(id){
      block.addLine({ value: `cy.get('#${id}').should('be.visible')`})
    } else if(selector) {
      block.addLine({ value: `cy.get('${selector}').should('be.visible')` })
    } else {
      block.addLine({ value: `cy.get("${tagName}:contains(${innerText})").should('be.visible')`})
    }
  }

  _handleKeyDown (selector, value) {
    value = this.format(value);
    const block = new Block(this._frameId, 2)
    block.addLine({ value: `cy.get('${selector}').type(${value}, {delay: ${this._options.typingDelay}})` })
    return block
  }

  _handleKeyPress(block, selector, value) {
    block.addLine({value: `cy.get('${selector}').type('${value}', {delay: ${this._options.typingDelay}})`})
  }

  _handleClick (block, selector) {
    block.addLine({ value: `cy.get("${selector}").click()`})
  }

  _handleChange (block, selector, value) {
    block.addLine({ value: `cy.get('${selector}').select('${value}')` })
  }

  _handleGoto (block, href) {
    href = this.format(href)
    block.addLine({ value: `cy.visit(${href})` })
  }

  _handleViewport (block, width, height) {
    block.addLine({ value: `cy.viewport(${width}, ${height})` })
  }

}
