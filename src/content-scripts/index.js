import eventsToRecord from './dom-events-to-record'
import finder from '@medv/finder'

class EventRecorder {
  constructor () {
    this.previousEvent = null
  }

  start () {
    const events = Object.values(eventsToRecord)
    if (!window.eventRecorderInitialized) {
      const boundedRecordEvent = this.recordEvent.bind(this)
      events.forEach(type => {
        window.addEventListener(type, boundedRecordEvent, true)
      })
      window.eventRecorderInitialized = true
    }

    this.sendMessage({ control: 'event-recorder-started' })
    this.sendMessage({ control: 'get-current-url', value: window.location.href })
    this.sendMessage({ control: 'get-viewport-size', value: { width: window.innerWidth, height: window.innerHeight } })
  }

  sendMessage (msg) {
    try {
      chrome.runtime.sendMessage(msg)
    } catch (err) {
      console.debug('caught error', err)
    }
  }

  recordEvent (e) {
    if (this.previousEvent && this.previousEvent.timeStamp === e.timeStamp) return
    this.previousEvent = e

    let value = e.target.value;
    if(e.target.getAttribute && e.target.getAttribute('contenteditable')){
      value = e.target.textContent;
    }

    const msg = {
      action: e.type,
      value,
      altKey: e.altKey,
      shiftKey: e.shiftKey,
      ctrlKey: e.ctrlKey,
      key: e.key ? e.key : undefined,
      keyCode: e.keyCode ? e.keyCode : undefined,
      target: {
        tagName: e.target.tagName ? e.target.tagName : undefined,
        selector: finder(e.target, { seedMinLength: 5, optimizedMinLength: 10 }),
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

window.eventRecorder = new EventRecorder()
window.eventRecorder.start()
