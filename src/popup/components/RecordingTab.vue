<template>
  <div class="tab recording-tab">
    <div class="content">
      <div class="empty" v-show="!isRecording">
        <img src="/images/Desert.svg" alt="desert" width="78px">
        <h3>No recorded events</h3>
        <p class="text-muted">Click record to begin</p>
      </div>
      <div id="events" class="events" v-show="isRecording">
        <p class="text-muted text-center loading" v-show="liveEvents.length === 0">Waiting for events</p>
        <ul class="event-list">
          <li v-for="(event, index) in liveEvents"
          :key="index"
          class="event-list-item"
          :class="getActiveClass(event, index)"
          @mouseover="setActiveItem(event, index)"
          @mousedown="mousedownItem(event, index)">
            <div class="event-label">
              {{index + 1}}.
            </div>
            <div class="event-description">
              <div class="text-muted">{{event.comment}}</div>
              <div class="event-action">{{event.action}}</div>
              <div class="event-props text-muted">{{parseEventValue(event)}}</div>
            </div>
            <div v-if="activeIndex === index">
              <img src="/images/icon-edit.svg" v-b-tooltip.hover title="Edit Event" @click="editItem(event, index)">
              <img src="/images/icon-move-up.svg" v-b-tooltip.hover title="Move Up" @click="moveItemUp(event, index)">
              <img src="/images/icon-move-down.svg" v-b-tooltip.hover title="Move Down" @click="moveItemDown(event, index)">
              <img src="/images/icon-remove.svg" v-b-tooltip.hover title="Remove Event" @click="removeItem(event, index)">
            </div>
          </li>
        </ul>
      </div>
      <div class="recording-footer" v-show="isRecording">
        <img src="/images/icon-variable.svg" @click="variable" v-b-tooltip.hover title="Variable" alt="Add Variable">
        <img src="/images/icon-wait.svg" @click="wait" v-b-tooltip.hover title="Wait" alt="Add Wait">
        <img src="/images/icon-wait-for.svg" @click="waitFor" v-b-tooltip.hover title="Wait For" alt="Add Wait For">
        <img src="/images/icon-text-click.svg" @click="textClick" v-b-tooltip.hover title="Text Click" alt="Add Text Click">
        <img src="/images/icon-visit.svg" @click="visitUrl" v-b-tooltip.hover title="Visit URL" alt="Visit URL">
      </div>
      <EditEventTab :event="currentEvent" v-show="showDetails"/>
      <AddEventTab :event="newEvent" v-show="showNewEvent"/>
    </div>
  </div>
</template>
<script>

  import { global } from '../../code-generator/global-settings'
  import uuid from '../../background/uuid'
  import EditEventTab from "./EditEventTab.vue";
  import AddEventTab from "./AddEventTab.vue";

  export default {
    name: 'RecordingTab',
    components: { EditEventTab, AddEventTab },
    props: {
      isRecording: { type: Boolean, default: false },
      liveEvents: { type: Array, default: () => [] }
    },
    watch: {
      isRecording: function(recording){
        this.showDetails = recording && this.currentEvent && liveEvents.length > 0 ? true : false
        this.showNewEvent = recording && this.newEvent && liveEvents.length > 0 ? true : false
      }
    },
    data() {
      return {
        currentEvent: undefined,
        newEvent: undefined,
        options: { global },
        activeIndex: undefined,
        selectedIndex: undefined
      }
    },
    mounted () {
      chrome.storage.local.get(['options'], ({ options }) => {
        this.options = options;
      })
      this.bus = this.$chrome.extension.connect({ name: 'recordControls' })
    },
    methods: {
      scrollToEnd: function() {
        var container = this.$el.querySelector("#events");
        container.scrollTop = container.scrollHeight;
      },
      variable () {
        this.sendMessage({ id: uuid(), action: 'variable*', name: "myvariable",  value: "myvalue" })
        this.scrollToEnd();
      },
      wait () {
        this.sendMessage({ id: uuid(), action: 'wait*', value: this.options.global.wait })
        this.scrollToEnd();
      },
      waitFor () {
        this.sendMessage({ id: uuid(), action: 'wait-for*' })
        this.scrollToEnd();
      },
      textClick() {
        this.sendMessage({ id: uuid(), action: 'click-on*' })
        this.scrollToEnd();
      },
      visitUrl () {
        this.sendMessage({id: uuid(), action: "goto*", value: "https://", setLocalStorage: false})
        this.scrollToEnd();
      },
      getActiveClass(event, index) {
        if(this.selectedIndex == index){
          return "selected-item"
        }
        if(this.activeIndex == index){
          return "active-item"
        }
      },
      setSelectedItem(event, index) {
        this.selectedIndex = index
      },
      mousedownItem(event, index) {
        this.selectedIndex = index
        this.activeIndex = index
        this.currentEvent = event
        this.showDetails = true
      },
      setActiveItem(event, index) {
        this.activeIndex = index;
      },
      moveItemUp(event, index){
        if(index === 0) {
          return
        }
        this.liveEvents.splice(index, 1)
        this.insertItem(event, index - 1)
        this.selectedIndex = index - 1
        this.currentEvent = event;
      },
      moveItemDown(event, index){
        if(index + 1 === this.liveEvents.length){
          return
        }
        this.liveEvents.splice(index, 1)
        this.insertItem(event, index + 1)
        this.selectedIndex = index + 1
        this.currentEvent = event;
      },
      insertItem(event, index){
        this.liveEvents.splice(index, 0, event)
        this.sendMessage({ action: 'insert-event', event, index })
        this.selectedIndex = index
      },
      removeItem(event, index){
        if(event === this.currentEvent){
          this.currentEvent = undefined;
          this.showDetails = false;
        }
        if(event === this.newEvent){
          this.newEvent = undefined;
          this.showNewEvent = false;
        }
        this.liveEvents.splice(index, 1)
        this.sendMessage({ action: 'remove-event', event })
        this.selectedIndex = -1
      },
      editItem(event, index){
        this.currentEvent = event;
        this.showDetails = true
        this.showNewEvent = false
        this.selectedIndex = index
      },
      sendMessage(msg){
        try{
          this.bus.postMessage(msg)
        }catch(error){
          chrome.extension.getBackgroundPage().console.log("There was an issue sending the message", error)
        }
      },
      substring(value){
        if(value.length > 80){
          return value.substring(0,77) + "..."
        }
        return value
      },
      parseEventValue (event) {
        if (event.action === 'viewport*') return `width: ${event.value.width}, height: ${event.value.height}`
        if (event.action === 'goto*') return this.substring(event.value)
        if (event.action === 'navigation*') return ''
        if (event.action === 'mousemove') return this.substring(`x: ${event.clientX}, y: ${event.clientY}`)
        if (event.action === 'keydown') return `key: ${event.key}`
        if (event.action === 'mousedown') return this.substring(`path: ${event.target.selector}`)
        if (event.action === 'click-text*') return this.substring(`text: ${event.target.innerText}`)
        if (event.action === 'wait-for-text*') return this.substring(`text: ${event.target.innerText}`)
        if (event.action === 'type-text*') return this.substring(`text: ${event.value}`)
        if (event.action === 'wait*') return `timeout: ${event.value}`
        if (event.action === 'variable*') return this.substring(`name: ${event.name}, value: ${event.value}`)
        return ''
      }
    }
  }
</script>
<style lang="scss" scoped>
  @import "~styles/_animations.scss";
  @import "~styles/_variables.scss";
  @import "~styles/_mixins.scss";

  .recording-footer {
    @include footer()
  }

  li.active-item {
    background-color: aliceblue
  }

  li.selected-item {
    background-color: antiquewhite
  }

  .recording-tab {
    .content {
      display:flex;
      flex-direction:column;
      height:100%;
      min-height: 200px;
      .empty {
        padding: $spacer;
        text-align: center;
      }

      .events {
        max-height: $max-content-height;
        flex: 1;
        height:100%;
        overflow: auto;
        display: flex;
        flex-direction: column-reverse;

        .loading:after {
          content: '.';
          animation: dots 1s steps(5, end) infinite;
          animation-delay: 1.5s;
          margin-bottom: auto;
        }

        .event-list {
          list-style-type: none;
          padding: 0;
          margin: 0;

          .event-list-item {
            padding: 12px;
            font-size: 12px;
            border-top: 1px solid $gray-light;
            display: flex;
            flex: 1 1 auto;
            height: 44px;

            .event-label {
              vertical-align: top;
              margin-right: $spacer;
            }

            .event-description {
              margin-right: auto;
              display: inline-block;

              .event-action {
                font-weight: bold;
              }

              .event-props {
                white-space: pre;
              }
            }

          }
        }
      }
    }
  }
</style>
