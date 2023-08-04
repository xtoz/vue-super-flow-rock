<!--
 * User: xtoz
 * Date: 2023/8/2
 * Time: 9:55
-->
<template>
  <div
    tabindex="-1"
    class="super-flow__pannel"
    :style="style"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
    @contextmenu.prevent.stop
  >
    <div v-if="mounseIn">
      <slot> </slot>
    </div>
    <div v-else></div>
  </div>
</template>

<script>
export default {
  props: {
    graph: Object,
    pannel: Object,
  },
  data() {
    return {};
  },
  computed: {
    style() {
      if (this.graph.mouseOnPannel === this.pannel) {
        const { position, width, height } = this.pannel;
        return {
          width: width + "px",
          height: height + "px",
          top: position[1] + "px",
          left: position[0] + "px",
        };
      } else {
        const { thumbPosition, thumbWidth, thumbHeight } = this.pannel;
        return {
          width: thumbWidth + "px",
          height: thumbHeight + "px",
          top: thumbPosition[1] + "px",
          left: thumbPosition[0] + "px",
        };
      }
    },
    mounseIn() {
      return this.graph.mouseOnPannel === this.pannel;
    },
  },
  methods: {
    onMouseEnter(evt) {
      this.graph.mouseOnPannel = this.pannel;
    },
    onMouseLeave(evt) {
      this.graph.mouseOnPannel = null;
    },
  },
  mounted() {},
};
</script>

<style lang="less">
.super-flow__pannel {
  box-shadow: 1px 2px 8px rgba(0, 0, 0, 0.2);
  user-select: none;

  position: fixed;
  background-color: #ffffff;
  border: 1px solid rgb(180, 180, 180);
  z-index: 3;
  outline: none;

  transition: width 0.5s, height 0.5s, top 0.5s;    // 时间一样就能保证上下扩张速度相等
}
</style>
