import {global} from './global-settings'
import yaml from 'js-yaml'

export class CodeGeneratorYaml {
    constructor (options) {
        this._options = Object.assign(global, options)
    }

    generate (events) {
        let il = {
            actions: events
        }
        var actionLength = il.actions.length;
        for (var i = 0; i < actionLength; i++) {
            delete il.actions[i].id
        }
        return yaml.dump(il)
    }
}
