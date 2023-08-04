/**
 * User: CHT
 * Date: 2020/5/8
 * Time: 14:01
 */

import {
  uuid,
  vector,
  mark
} from './utils'

import {
  direction,
  directionVector
} from './types'

export default class GraphLink {
  static distance = 15

  constructor (options, graph) {
    const {
      key = null,
      start,  // start和end是graphNode
      end = null,
      startAt = [0, 0], // 这个坐标是，以起点node左下角为坐标原点时，link起点的坐标（如node宽100高80，link坐标[100.40]，则该点为node右侧中点）
      endAt = [0, 0],
      meta = null,
    } = options

    this.$options = options


    this.key = key || uuid('link-')

    this.graph = graph
    this.start = start
    this.end = end
    this.startDirection = directionVector[direction.top]  // 默认值，勿当真
    this.endDirection = directionVector[direction.top]
    this.startAt = startAt
    this.endAt = endAt
    this.meta = meta
  }

  get end () {
    return this._end
  }

  set end (node) {
    if (this.start === node) {
      return false
    } else {
      this._end = node
    }
  }

  get startAt () {
    return this._startAt
  }

  set startAt (offset) {  // 这里叫offset确实有点迷惑，其实就是startAt相对于node的坐标，详见graphNode的relative函数
    const relative = this.start.relative(offset)
    this._startAt = relative.position
    this.startDirection = relative.direction
  }

  get endAt () {
    return this._endAt
  }

  set endAt (offset) {
    if (this.end) {  // 有终点node，走流程设置终点坐标
      const relative = this.end.relative(offset)
      this._endAt = relative.position
      this.endDirection = relative.direction
    } else {  // 在拖拽拉线时，终点不会附着到node上，所以直接设置坐标
      this._endAt = offset
    } // 这里有个问题就是，根据有无终点node，offset的语义不一样，一个是相对于node的坐标，一个是相对于graph的坐标，容易令人迷惑
  }

  // movePosition：拉线时所使用的变量
  get movePosition () {
    return this._movePosition
  }

  set movePosition (offset) { // offset为相对于graph左上角的坐标
    this._movePosition = offset

    if (this.end) return  // 有终点node时返回，这就实现了当拉线拉到一个点node中时，link暂时被吸附在node上面

    const relative = this.start.relative( // 这个是为了计算endDirection
      vector(offset)
        .minus(this.graph.origin)
        .minus(this.start.coordinate)
        .end
    )

    this.endDirection = vector(relative.direction)  // endDirection取反，为什么这么做要看endDirection有什么用
      .multiply(-1)
      .end
  }

  get pathPointList () {  // 路径上的点
    const pointList = this.coordinateList()
      , xList = []
      , yList = []

    pointList.forEach(item => {
      xList.push(item[0])
      yList.push(item[1])
    })

    return {
      pointList,
      xList,
      yList,
      minX: Math.min(...xList),
      maxX: Math.max(...xList),
      minY: Math.min(...yList),
      maxY: Math.max(...yList)
    }
  }

  startCoordinate () {  // 获取startAt物理坐标，建议统一表述，逻辑坐标用coordinate，物理坐标用position
    return vector(this.start.position)
      .add(this.startAt)
      .end
  }

  endCoordinate () {  // 获取endAt物理坐标
    if (this.end) {
      return vector(this.end.position)
        .add(this.endAt)
        .end
    } else {
      return this.movePosition
    }
  }

  coordinateList (turnRatio = 0.5) {// 只给pathPointList使用过，计算路径上的点，不好理解，先标记为TODO
    const entryPoint = this.startCoordinate()
    const exitPoint = this.endCoordinate()

    const entryDirection = this.startDirection
    let exitDirection = this.endDirection

    // 路径起点：起点坐标+
    const startPoint = vector(entryDirection)
      .multiply(GraphLink.distance)
      .add(entryPoint)
      .end

    // 路径终点
    const endPoint = vector(exitDirection)
      .multiply(GraphLink.distance)
      .add(exitPoint)
      .end

    // 入口方向取反
    exitDirection = vector(exitDirection)
      .multiply(-1)
      .end

    // 终点 - 起点  垂直 水平向量
    const pathHorizontalVec = [endPoint[0] - startPoint[0], 0]
    const pathVerticalVec = [0, endPoint[1] - startPoint[1]]

    const startDirection = this.pathDirection(
      pathVerticalVec,
      pathHorizontalVec,
      entryDirection
    )
    const endDirection = this.pathDirection(
      pathVerticalVec,
      pathHorizontalVec,
      exitDirection
    )

    const splitNum = vector(startDirection)
      .dotProduct(endDirection)
      .end > 0 ? 2 : 1

    const pathMiddle = endDirection === pathHorizontalVec
      ? pathVerticalVec
      : pathHorizontalVec

    let points = []

    points.push(entryPoint, startPoint)

    if (splitNum === 1) {

      const point1 = vector(startPoint)
        .add(startDirection)
        .end

      const point2 = vector(point1)
        .add(endDirection)
        .end
      points.push(point1, point2)

    } else {
      const point1 = vector(startDirection)
        .multiply(turnRatio)
        .add(startPoint)
        .end

      const point2 = vector(point1)
        .add(pathMiddle)
        .end

      const point3 = vector(endDirection)
        .multiply(1 - turnRatio)
        .add(point2)
        .end

      points.push(point1, point2, point3)
    }

    points.push(exitPoint)

    return points
  }

  pathDirection (vertical, horizontal, direction) {
    if (
      vector(horizontal)
        .parallel(direction)
        .end
    ) {
      if (
        vector(horizontal)
          .dotProduct(direction)
          .end > 0
      ) {
        return horizontal
      } else {
        return vertical
      }
    } else {
      if (
        vector(vertical)
          .dotProduct(direction)
          .end > 0
      ) {
        return vertical
      } else {
        return horizontal
      }
    }
  }

  isPointInLink (position, pathPointList) {
    const {
      pointList,
      minX,
      minY,
      maxX,
      maxY
    } = pathPointList || this.pathPointList

    const n = 5

    if (
      position[0] < minX - n
      || position[0] > maxX + n
      || position[1] < minY - n
      || position[1] > maxY + n
    ) {
      return false
    }

    for (let i = 0; i < pointList.length - 2; i++) {
      const prev = pointList[i]
      const current = pointList[i + 1]

      const top = Math.min(prev[1], current[1]) - n
      const right = Math.max(prev[0], current[0]) + n
      const bottom = Math.max(prev[1], current[1]) + n
      const left = Math.min(prev[0], current[0]) - n

      const [x, y] = position

      if (x > left && x < right && y > top && y < bottom) {
        return true
      }
    }
    return false
  }

  remove () {
    return this.graph.removeLink(this)
  }

  toJSON () {
    return {
      key: this.key,
      start: this.start.key,
      end: this.end.key,
      startAt: this.startAt,
      endAt: this.endAt,
      meta: this.meta
    }
  }
}
