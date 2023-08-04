<!--
 * User: CHT
 * Date: 2020/5/25
 * Time: 9:12
-->
<template>
  <!-- node本体 -->
  <div
    tabindex="-1"
    class="super-flow__node"
    :class="{'can-move': nodeDrop}"
    :style="style"
    @mousedown.left="nodeMousedown"
    @mouseenter="nodeMouseenter"
    @mouseleave="nodeMouseleave"
    @mouseup="nodeMouseup"
    @contextmenu.prevent.stop="nodeContextmenu">
    <!-- 这里的 :node="node" 是不需要的，因为它是传给上层 template 而 index.vue 并没有接收该 node -->
    <!-- 上层 template 中的 slot 中的 :node="node" 是直接从 v-for="(node,key) in xxx" 拿的 node --> 
    <slot :node="node"
    />
    <!-- node本体的周围上下左右四个边界 -->
    <div
      v-for="(dir, key) in direction"
      :key="key"
      v-show="output && lineDrop"
      :class="`node-side node-side-${key}`"
      @contextmenu.stop.prevent
      @mousedown.left.prevent.stop="evt => sideMousedown(evt, dir)">
    </div>
  </div>
</template>

<script>
import {
  direction
} from './types'

import {
  getOffset
} from './utils'

export default {
  props: {
    graph: Object,
    node: Object,
    index: Number,
    isMove: Boolean,  //这个没有使用？
    isTemEdge: Boolean, // 目前是否正在拉线，对应外部is-tem-edge
    nodeIntercept: Function,  // 劫持拉线开始事件
    lineDrop: Boolean,  // TODO:这个应该改名 linkAddable，在index.vue中，控制是否能被拉线
    nodeDrop: Boolean // TODO:这个应该改名 nodeDragable，在index.vue中，控制是否能够拖动节点
  },
  data () {
    return {
      direction,
      output: this.nodeIntercept()
    }
  },
  computed: {
    style () {  // style 是用来定位的，而非控制样式
      const {
        position,
        width,
        height
      } = this.node

      return {
        width: width + 'px',
        height: height + 'px',
        top: position[1] + 'px',
        left: position[0] + 'px'
      }
    }
  },
  methods: {  // 事件都交给graph去处理了
    nodeMousedown (evt) { // 处理拖动node的前置事件
      this.graph.toLastNode(this.index)
      this.$emit('node-mousedown', evt, this.node, getOffset(evt))
    },

    nodeMouseenter (evt) {
      this.output = this.nodeIntercept()  // 一是设置当前所在节点
      this.graph.mouseonNode = this.node
      if (!this.isTemEdge) return // 二是如果当前正在拉线，还需要触发index中的事件，为拉线设置临时的结束node
      this.$emit('node-mouseenter', evt, this.node, getOffset(evt, this.$el))
    },

    nodeMouseleave () { // 类似于nodeMouseenter，一是设置当前所在节点为空，二是触发index中的事件，为拉线解除临时的结束node
      this.graph.mouseonNode = null
      if (!this.isTemEdge) return
      this.$emit('node-mouseleave')
    },

    nodeMouseup () {  // 类似于nodeMouseleave，不过只触发index中的事件，将临时拉线加入为实际的连线。
      if (!this.isTemEdge) return
      this.$emit('node-mouseup')
    },

    nodeContextmenu (evt) {
      this.$emit('node-contextmenu', evt, this.node)
    },

    sideMousedown (evt) {
      this.$emit('side-mousedown', evt, this.node, getOffset(evt, this.$el))
    }
  }
}
</script>

<style lang="less">
.super-flow__node {
  box-shadow       : 1px 2px 8px rgba(0, 0, 0, .2);
  user-select      : none;

  position         : absolute;
  background-color : #ffffff;
  border           : 1px solid rgb(180, 180, 180);
  z-index          : 1;
  outline          : none;

  &.can-move {
    cursor : move;
  }

  &-header {
    background-color : green;
  }

  &-body {

  }

  .node-side {
    @size    : 10px;
    position : absolute;
    cursor   : crosshair;

    &-top {
      top    : -(@size/2);
      right  : 0;
      left   : 0;
      height : @size;
    }

    &-right {
      top    : 0;
      right  : -(@size/2);
      bottom : 0;
      width  : @size;
    }

    &-bottom {
      right  : 0;
      bottom : -(@size/2);
      left   : 0;
      height : @size;
    }

    &-left {
      top    : 0;
      bottom : 0;
      left   : -(@size/2);
      width  : @size;
    }
  }

  &:hover {
    box-shadow : 1px 2px 8px rgba(0, 0, 0, .4);
  }

  &.isSelect {
    z-index : 2;
  }
}
</style>
