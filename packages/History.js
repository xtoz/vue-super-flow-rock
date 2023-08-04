/**
 * User: xtoz
 * Date: 2023/8/2
 * Time: 20:07
 */

import {arrayReplace, isFun} from './utils'

class History {
    constructor() {
        this.undoStack=[]
        this.redoStack=[]
        this.redoMap=new Map();
        this.undoMap=new Map();
        this.maxStackLen=50  // 历史记录数目
    }

    // 加入一个操作事件，参数建议为 event:string, params:[]，在后续 undo 时，prams 会解构处理
    push(event,params) {
        if(this.undoMap.has(event)) {
            this.undoStack.push({event,params})
            if(this.undoStack.length>this.maxStackLen) {
                this.undoStack.shift()
            }
            arrayReplace(this.redoStack,[])   // 任何新事件都会清空 redo
        }
    }

    undo() {
        if(this.undoStack.length > 0) {
            let lastEvent=this.undoStack.pop()
            if(this.undoMap.has(lastEvent.event) && this.undoMap.get(lastEvent.event)) {
                this.undoMap.get(lastEvent.event)(...lastEvent.params)
                this.redoStack.push(lastEvent)
            }
        }
    }

    redo() {
        if(this.redoStack.length > 0) {
            let lastEvent=this.redoStack.pop()
            if(this.redoMap.has(lastEvent.event) && this.redoMap.get(lastEvent.event)) {
                this.redoMap.get(lastEvent.event)(...lastEvent.params)
                this.undoStack.push(lastEvent)
            }
        }
    }

    // 定义撤销&反撤销，因此回调函数是成对的
    // event 建议为字符串，以明确语义
    // callundo 建议为 bind 了 this 的回调函数，以明确 this 语义
    // 两个 callundo 都会使用同样的 push 时传入的 param，注意遵从这点编写代码
    setReverse(event, undoCb, redoCb) {
        if(!event || !isFun(undoCb) || !isFun(redoCb)) {
            return false
        }
        if(this.undoMap.has(event)||this.redoMap.has(event)) {
            return false
        }
        else {
            this.undoMap.set(event,undoCb)
            this.redoMap.set(event,redoCb)
        }
        return true
    }
}

export default History
