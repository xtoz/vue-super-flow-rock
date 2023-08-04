<!--
 * User: xtoz
 * Date: 2023/8/4
 * Time: 11:49
-->
<template>
  <!-- templateNode -->
  <div
    tabindex="-1"
    class="super-flow__template_node"
    :style="style"
    @mousedown.left="nodeMousedown"
    @mouseenter="nodeMouseenter"
    @mouseleave="nodeMouseleave"
    @mouseup="nodeMouseup"
    @contextmenu.prevent.stop="() => null"
  >
    <slot />
  </div>
</template>

<script>
import { getOffset } from "../utils";

export default {
  props: {
    graph: Object,
    node: Object,
    index: Number,
    isMove: Boolean, //这个没有使用？
    isTemEdge: Boolean, // 目前是否正在拉线，对应外部is-tem-edge
  },
  data() {
    return {};
  },
  computed: {
    style () {  // style 是用来定位的，而非控制样式
      const {
        width,
        height
      } = this.node

      return {
        width: width + 'px',
        height: height + 'px',
      }
    },
  },
  methods: {
    nodeMousedown(evt) {
      this.graph.dispatch({
        type: 'template-node-mousedown',
        mouseevent: evt,
        offset: getOffset(evt, this.$el),
        jsnode: this.node,
        }, false)
    },

    nodeMouseenter(evt) {
    },

    nodeMouseleave(evt) {
    },

    // TODO：目前实现拖拽、拷贝节点时，不会拷贝这些事件绑定关系，因此只能在 index 的全局事件中处理,
    // 而且目前的做法还存在 meta 得作为额外参数处理等问题，聚合程度极低，代码非常松散。
    // 之后还是得改成拉线那种思路才行（直接在 canvas 中放一个 templateNode，不用担心 slot 会不会不渲染
    // 通过菜单添加的节点不都渲染得好好的么？
    nodeMouseup(evt) {
      this.graph.dispatch({
        type: 'template-node-mouseup',
        mouseevent: evt,
        offset: getOffset(evt, this.$el),
        jsnode: this.node,
        }, false)
    },
  },
};
</script>

<style lang="less">
.super-flow__template_node {
  box-shadow       : 1px 2px 8px rgba(0, 0, 0, .2);
  user-select      : none;

  position         : static;
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

  &:hover {
    box-shadow : 1px 2px 8px rgba(0, 0, 0, .4);
  }

  &.isSelect {
    z-index : 2;
  }
}
</style>
