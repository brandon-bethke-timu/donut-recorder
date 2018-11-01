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
      return yaml.dump(il)
    }
}
