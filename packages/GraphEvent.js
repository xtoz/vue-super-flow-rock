/**
 * User: CHT
 * Date: 2020/6/3
 * Time: 14:53
 */

// 通用的事件类，提供添加、删除、触发事件回调的接口
// 该类提供了跨多层父子组件通信的方式
export default class GraphEvent {
  constructor () {
    this.listeners = {}
  }

  // 添加事件回调，事件不存在时创建事件
  add (type, callback) {
    if (!(type in this.listeners)) {
      this.listeners[type] = [] // 事件可以有多个回调
    }
    this.listeners[type].push(callback)
  }

  // 移除事件回调（事件本身无法被移除）
  remove (type, callback) {
    if (!(type in this.listeners)) {
      return
    }
    const stack = this.listeners[type]
    for (let i = 0, l = stack.length; i < l; i++) {
      if (stack[i] === callback) {
        stack.splice(i, 1)
        return this.remove(type, callback) // 递归，以处理callback被多次传入的情况
      }
    }
  }

  // 触发事件的回调
  dispatch (event, breakOff = false) {
    if (!(event.type in this.listeners)) {
      return
    }
    const stack = this.listeners[event.type]  //似乎没有安全判断？可以执行后续的some和forEach吗？
    event.target = this // 下面其实也传递了 this，这个event.target 不需要也行，而且 target 语义不明

    // 当指定breakOff时，执行到第一个具有返回值的回调就结束
    if (breakOff) {
      stack.some((fun, idx) => {
        const result = fun.call(this, event)  // 此时sum还不算被定义，因此this并不指向graghEvent
        if (result) stack.unshift(...stack.splice(idx, 1))  // 删除再插到首位，☆意☆义☆不☆明☆
        return result
      })
    } else {
      stack.forEach(fun => fun.call(this, event)) // this 指向 graph
    }
  }
}
