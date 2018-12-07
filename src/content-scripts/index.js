import eventsToRecord from './dom-events-to-record'
import finder from '@medv/finder'
import uuid from '../background/uuid'

class EventRecorder {
  constructor () {
    this.previousEvent = null
  }

  start () {
    chrome.storage.local.get(['options'], ({ options }) => {
      this.dataAttribute = options && options.global ? options.global.dataAttribute : undefined
    });
    const events = Object.values(eventsToRecord)
    if (!window.eventRecorderInitialized) {
        const boundedRecordEvent = this.recordEvent.bind(this)
        events.forEach(type => {
            window.addEventListener(type, boundedRecordEvent, true)
        })
        window.eventRecorderInitialized = true
    }
    this.sendMessage({ control: 'get-current-url', value: window.location.href })
    this.sendMessage({ control: 'get-viewport-size', value: { width: window.innerWidth, height: window.innerHeight } })
  }

  sendMessage (msg) {
    try {
      chrome.runtime.sendMessage(msg)
    } catch (err) {
      console.log('caught error', err)
    }
  }

  recordEvent (e) {
    if (this.previousEvent && this.previousEvent.timeStamp === e.timeStamp) return
    this.previousEvent = e

    const selector = e.target.hasAttribute && e.target.hasAttribute(this.dataAttribute)
      ? formatDataSelector(e.target, this.dataAttribute)
      : finder(e.target, { seedMinLength: 5, optimizedMinLength: 10 })

    let value = e.target.value;
    if(e.target.getAttribute && e.target.getAttribute('contenteditable')){
      value = e.target.textContent;
    }
    const msg = {
      id: uuid(),
      action: e.type,
      value,
      altKey: e.altKey,
      shiftKey: e.shiftKey,
      ctrlKey: e.ctrlKey,
      key: e.key ? e.key : undefined,
      keyCode: e.keyCode ? e.keyCode : undefined,
      target: {
        tagName: e.target.tagName ? e.target.tagName : undefined,
        selector: selector,
        href: e.target.href ? e.target.href : undefined,
        innerText: e.target.innerText ? e.target.innerText.normalize() : undefined,
        id: e.target.id ? e.target.id : undefined
      },
      clientX: e.clientX,
      clientY: e.clientY
    }
    this.sendMessage(msg)
  }
}

function formatDataSelector (element, attribute) {
  return `[${attribute}=${element.getAttribute(attribute)}]`
}

window.eventRecorder = new EventRecorder()
window.eventRecorder.start()
