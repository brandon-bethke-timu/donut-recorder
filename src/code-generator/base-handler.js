export class BaseHandler {
    constructor(options){
        this.options = options
    }

    isExpression(expression){
        if(expression === undefined || expression === null){
            return false;
        }
        if(expression.match(/^['].*[']$/)){
            return true;
        }

        if(expression.match(/^["].*["]$/)){
            return true;
        }
        let isExpression = false
        isExpression = isExpression || expression.match(/\{\{([A-Za-z0-9]*)\}\}/)
        isExpression = isExpression || expression.match(/getString\(\)/)
        return isExpression
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
