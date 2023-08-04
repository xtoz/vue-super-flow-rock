<!--
 * User: xtoz
 * Date: 2023/8/3
 * Time: 15:44
-->
<template>
  <!-- 可拖拽到canvas中的节点模板的Node -->
  <div
    tabindex="-1"
    class="super-flow__nodePannel"
    @contextmenu.prevent.stop
  >
    <graph-template-node
      class="static-node"
      v-for="(node, idx) in graph.templateNodeList"
      :key="node.key"
      :index="idx"
      :node="node"
      :graph="graph"
      :nodeIntercept="()=>true"
    >
      <template>
        <!-- slot 中的 :node="node" 是直接从 v-for="(node,key) in xxx" 拿的 node。并非底层 slot 上传的 -->
        <slot :node="node"> </slot>
      </template>
    </graph-template-node>
  </div>
</template>

<script>
import GraphTemplateNode from "./templateNode.vue";

export default {
  props: {
    graph: Object,
  },
  components: {
    GraphTemplateNode,
  },
  data() {
    return {
    };
  },
  computed: {},
  methods: {},
  mounted() {},
};
</script>

<style lang="less">
.super-flow__pannel {
  user-select: none;
  position: relative;
  background: #cccccc;
  outline: none;
  overflow: scroll;

  display: flex;
  flex-direction: column;
  justify-content: flex-start;

  &::-webkit-scrollbar {
    display: none;
  }
}
.static-node {
  position: static;
}
</style>
