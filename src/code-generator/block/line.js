export default Line {
    constructor({value, terminator}){
        this._terminator = terminator ? terminator : ''
        this.line = value;
    }

    getTerminator(){
        return this._terminator;
    }

    setTerminator(terminator){
        this._terminator = terminator;
    }

    getLine(){
        return this.line + this.getTerminator();
    }
}
