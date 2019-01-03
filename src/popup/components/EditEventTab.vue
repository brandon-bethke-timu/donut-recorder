<template>
    <div class='edit-event'>
        <div v-show="event.action === 'variable*'" class="event-property-table">
            <div class="event-property-names">
                <div><label>Name:</label></div>
                <div><label>Value:</label></div>
                <div><label>Timeout:</label></div>
                <div><label>Comment:</label></div>
            </div>
            <div>
                <div><input class="event-edit-property" v-model="event.name" type="textbox" v-on:change="save(event)"></div>
                <div><input class="event-edit-property" v-model="event.value" type="textbox" v-on:change="save(event)"></div>
                <div><input class="event-edit-property" v-model="event.timeout" type="textbox" v-on:change="save(event)"></div>
                <div><input class="event-edit-property" v-model="event.comment" type="textbox" v-on:change="save(event)"></div>
            </div>
            <div>
            </div>
        </div>
        <div v-show="event.action === 'wait*'" class="event-property-table">
            <div class="event-property-names">
                <div><label>Timeout:</label></div>
                <div><label>Comment:</label></div>
            </div>
            <div>
                <div><input class="event-edit-property" v-model="event.value" type="textbox" v-on:change="save(event)"></div>
                <div><input class="event-edit-property" v-model="event.comment" type="textbox" v-on:change="save(event)"></div>
            </div>
        </div>
        <div v-if="event.action === 'type-text*'" class="event-property-table">
            <div class="event-property-names">
                <div><label>Force:</label></div>
                <div><label>Clear:</label></div>
                <div><label>Selector:</label></div>
                <div><label>Text:</label></div>
                <div><label>Delay:</label></div>
                <div><label>Timeout:</label></div>
                <div><label>Comment:</label></div>
            </div>
            <div>
                <div><input class="event-edit-property" v-model="event.force" type="checkbox" v-on:change="save(event)"></div>
                <div><input class="event-edit-property" v-model="event.clear" type="checkbox" v-on:change="save(event)"></div>
                <div><input class="event-edit-property" v-model="event.target.selector" type="textbox" v-on:change="save(event)"></div>
                <div><input class="event-edit-property" v-model="event.value" type="textbox" v-on:change="save(event)"></div>
                <div><input class="event-edit-property" v-model="event.typingDelay" type="textbox" v-on:change="save(event)"></div>
                <div><input class="event-edit-property" v-model="event.timeout" type="textbox" v-on:change="save(event)"></div>
                <div><input class="event-edit-property" v-model="event.comment" type="textbox" v-on:change="save(event)"></div>
            </div>
        </div>
        <div v-if="event.action === 'goto*'" class="event-property-table">
            <div class="event-property-names">
                <div><label>Set Local Storage:</label></div>
                <div><label>URL:</label></div>
                <div><label>Timeout:</label></div>
                <div><label>Comment:</label></div>
            </div>
            <div>
                <div><input class="event-edit-property" v-model="event.setLocalStorage" type="checkbox" v-on:change="save(event)"></div>
                <div><input class="event-edit-property" v-model="event.value" type="textbox" v-on:change="save(event)"></div>
                <div><input class="event-edit-property" v-model="event.timeout" type="textbox" v-on:change="save(event)"></div>
                <div><input class="event-edit-property" v-model="event.comment" type="textbox" v-on:change="save(event)"></div>
            </div>
        </div>
        <div v-if="event.action === 'viewport*'" class="event-property-table">
            <div class="event-property-names">
                <div><label>Width:</label></div>
                <div><label>Height:</label></div>
                <div><label>Timeout:</label></div>
                <div><label>Comment:</label></div>
            </div>
            <div>
                <div><input class="event-edit-property" v-model="event.value.width" type="textbox" v-on:change="save(event)"></div>
                <div><input class="event-edit-property" v-model="event.value.height" type="textbox" v-on:change="save(event)"></div>
                <div><input class="event-edit-property" v-model="event.timeout" type="textbox" v-on:change="save(event)"></div>
                <div><input class="event-edit-property" v-model="event.comment" type="textbox" v-on:change="save(event)"></div>
            </div>
        </div>
        <div v-if="event.action === 'wait-for-text*'" class="event-property-table">
            <div class="event-property-names">
                <div><label>Inner Text:</label></div>
                <div><label>Timeout:</label></div>
                <div><label>Comment:</label></div>
            </div>
            <div>
                <div><input class="event-edit-property" v-model="event.target.innerText" type="textbox" v-on:change="save(event)"></div>
                <div><input class="event-edit-property" v-model="event.timeout" type="textbox" v-on:change="save(event)"></div>
                <div><input class="event-edit-property" v-model="event.comment" type="textbox" v-on:change="save(event)"></div>
            </div>
        </div>
        <div v-if="event.action === 'click-text*'" class="event-property-table">
            <div class="event-property-names">
                <div><label>Force:</label></div>
                <div><label>Inner Text:</label></div>
                <div><label>Timeout:</label></div>
                <div><label>Comment:</label></div>
            </div>
            <div>
                <div><input class="event-edit-property" v-model="event.force" type="checkbox" v-on:change="save(event)"></div>
                <div><input class="event-edit-property" v-model="event.target.innerText" type="textbox" v-on:change="save(event)"></div>
                <div><input class="event-edit-property" v-model="event.timeout" type="textbox" v-on:change="save(event)"></div>
                <div><input class="event-edit-property" v-model="event.comment" type="textbox" v-on:change="save(event)"></div>
            </div>
        </div>
        <div v-if="event.action === 'mousedown'" class="event-property-table">
            <div class="event-property-names">
                <div><label>Force:</label></div>
                <div><label>Inner Text:</label></div>
                <div><label>Timeout:</label></div>
                <div><label>Comment:</label></div>
            </div>
            <div>
                <div><input class="event-edit-property" v-model="event.force" type="checkbox" v-on:change="save(event)"></div>
                <div><input class="event-edit-property" v-model="event.target.selector" type="textbox" v-on:change="save(event)"></div>
                <div><input class="event-edit-property" v-model="event.timeout" type="textbox" v-on:change="save(event)"></div>
                <div><input class="event-edit-property" v-model="event.comment" type="textbox" v-on:change="save(event)"></div>
            </div>
        </div>
        <div v-if="event.action === 'keydown'" class="event-property-table">
            <div class="event-property-names">
                <div><label>Force:</label></div>
                <div><label>Key:</label></div>
                <div><label>Delay:</label></div>
                <div><label>Timeout:</label></div>
                <div><label>Comment:</label></div>
            </div>
            <div>
                <div><input class="event-edit-property" v-model="event.force" type="checkbox" v-on:change="save(event)"></div>
                <div><input class="event-edit-property" v-model="event.key" type="textbox" v-on:change="save(event)"></div>
                <div><input class="event-edit-property" v-model="event.typingDelay" type="textbox" v-on:change="save(event)"></div>
                <div><input class="event-edit-property" v-model="event.timeout" type="textbox" v-on:change="save(event)"></div>
                <div><input class="event-edit-property" v-model="event.comment" type="textbox" v-on:change="save(event)"></div>
            </div>
        </div>
    </div>
</template>
<script>
    import uuid from '../../background/uuid'

    export default {
        name: 'EditEventTab',
        props: {
            event: { type: Object, default: () => {} }
        },
        data () {
            return {
                bus: undefined
            }
        },
        mounted () {
            this.bus = this.$chrome.extension.connect({ name: 'recordControls' })
        },
        methods: {
            sendMessage(msg){
                try{
                  this.bus.postMessage(msg)
                }catch(error){
                  chrome.extension.getBackgroundPage().console.log("There was an issue sending the message", error)
                }
            },
            save(event){
                this.sendMessage({action: "update-event", event})
            }
        }
    }
</script>

<style lang="scss" scoped>
    @import "~styles/_variables.scss";

    .edit-event {
        background: $gray-lightest;
        height: 150px;
        display: flex;
        justify-content: flex-start;
        align-items: center;
        padding: 0 $spacer;
        font-weight: 500;
        border-top: 1px solid $gray-light;
    }
</style>
