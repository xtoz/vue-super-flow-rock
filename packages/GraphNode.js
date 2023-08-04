/**
 * User: CHT
 * Date: 2020/5/8
 * Time: 14:01
 */

import {
  minus,  // 这个minus应该是不需要的
  uuid,
  vector,
  mark
} from './utils'

import {
  direction,
  directionVector
} from './types'

// 逻辑上的Node类
export default class GraphNode {
  constructor (props, graph) {
    const {
      key = null,
      width = 180,
      height = 100,
      coordinate = [0, 0],
      meta = null
    } = props // 解构赋值

    this.$options = props

    this.key = key||uuid('node-') // 作为唯一标识
    this.graph = graph

    this.coordinate = [...coordinate] // 逻辑坐标
    this.meta = meta

    this.width = width
    this.height = height
  }

  get position () { // 将逻辑node坐标与原点物理位置相加，得到node的物理位置，给node.vue使用
    return vector(this.coordinate)
      .add(this.graph.origin)
      .end
  }

  set position (position) { // 位置被改变时（由于拖拽，响应式的position变化），将物理位置转化为逻辑坐标记录，position不应该在代码中被直接设置
    this.coordinate = vector(position)
      .minus(this.graph.origin)
      .end
  }

  get center () {
    return vector(this.coordinate)
      .add([this.width / 2, this.height / 2])
      .end
  }

  set center (position) {
    this.coordinate = vector(position)
      .minus([this.width / 2, this.height / 2])
      .end
  }

  get width () {
    return this._width
  }

  set width (w) {
    w = Math.floor(w)
    this._width = w > 50 ? w : 50
    this.angle()  // 宽度改变时angle也要改变
  }

  get height () {
    return this._height
  }

  set height (h) {
    h = Math.floor(h)
    this._height = h > 20 ? h : 20
    this.angle()  // 高度改变时angle也要改变
  }

  angle () {  // 不明白angle为什么不设置成get,set模式，因为计算消耗大吗
    const
      w = this.width / 2
      , h = this.height / 2
      , center = [0, 0]

    const topLeft = vector(center)
      .minus([w, h])
      .angle()
      .end

    const topRight = vector(center)
      .add([w, 0])
      .minus([0, h])
      .angle()
      .end

    const bottomRight = vector(center)
      .add([w, h])
      .angle()
      .end

    const bottomLeft = vector(center)
      .add([0, h])
      .minus([w, 0])
      .angle()
      .end

    this.angleList = [
      topLeft,
      topRight,
      bottomRight,
      bottomLeft
    ]
  }

  // 为link服务的接口：将以node右上角为原点的坐标转化为以node中心为原点的坐标，然后计算offset
  // 坐标的位置在原点的哪个方位（上下左右），再将offset坐标固定到那个方位的中点（以node右上角为原点）。
  relative (offset) {
    const angle = vector(offset)
      .minus([this.width / 2, this.height / 2])
      .angle()
      .end

    const angleList = this.angleList

    const directionList = [
      direction.top,
      direction.right,
      direction.bottom,
      direction.left
    ]

    let dir = direction.left

    angleList.reduce((prev, current, idx) => {
      if (angle >= prev && angle < current) {
        dir = directionList[idx - 1]
      }
      return current
    })

    return {
      position: this.fixOffset(offset, dir),
      direction: directionVector[dir]
    }
  }

  fixOffset (offset, dir) {
    switch (dir) {
      case direction.top:
        offset[0] = this.width / 2
        offset[1] = 0
        break
      case direction.right:
        offset[0] = this.width
        offset[1] = this.height / 2
        break
      case direction.bottom:
        offset[0] = this.width / 2
        offset[1] = this.height
        break
      case direction.left:
      default:
        offset[0] = 0
        offset[1] = this.height / 2
        break
    }
    return offset
  }

  remove () {
    return this.graph.removeNode(this)
  }

  toJSON () {
    return {
      key: this.key,
      width: this.width,
      height: this.height,
      coordinate: [...this.coordinate],
      meta: this.meta
    }
  }
}
