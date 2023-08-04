/**
 * User: CHT
 * Date: 2023/8/2
 * Time: 10:31
 */

import {
    uuid,
    vector,
    mark
} from './utils'

export default class GraphPannel {
    constructor(props, graph) {
        const {
            thumbCoordinate = [0, 0],
            thumbWidth = 10,
            thumbHeight = 10,
            width = 20,
            height = 20,
            coordinate = [0, 0],
            meta = null
        } = props // 解构赋值

        this.$options = props

        this.id = uuid('pannel')

        this.graph = graph

        this.thumbCoordinate = [...thumbCoordinate]
        this.coordinate = [...coordinate]
        this.meta = meta

        this.thumbWidth = thumbWidth
        this.thumbHeight = thumbHeight

        this.width = width
        this.height = height
    }

    get thumbPosition() {
        return vector(this.thumbCoordinate)
            .add(this.graph.origin)
            .end
    }

    set thumbPosition(position) {
        this.thumbCoordinate = vector(position)
            .minus(this.graph.origin)
            .end
    }

    get position() {
        return vector(this.coordinate)
            .add(this.graph.origin)
            .end
    }

    set position(position) {
        this.coordinate = vector(position)
            .minus(this.graph.origin)
            .end
    }

    get thumbWidth() {
        return this._thumbWidth
    }

    set thumbWidth(w) {
        w = Math.floor(w)
        this._thumbWidth = w > 10 ? w : 10
    }

    get thumbHeight() {
        return this._thumbHeight
    }

    set thumbHeight(h) {
        h = Math.floor(h)
        this._thumbHeight = h > 10 ? h : 10
    }

    get width() {
        return this._width
    }

    set width(w) {
        w = Math.floor(w)
        this._width = w
    }

    get height() {
        return this._height
    }

    set height(h) {
        h = Math.floor(h)
        this._height = h
    }

    remove() {
        return this.graph.removeNode(this)
    }

    toJSON() {
        return {
            id: this.id,
            width: this.width,
            height: this.height,
            coordinate: [...this.coordinate],
            meta: this.meta
        }
    }
}
