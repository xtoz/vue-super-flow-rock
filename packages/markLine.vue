<!--
 * User: CHT
 * Date: 2020/6/27
 * Time: 15:55
-->
<template>
  <canvas
    ref="markLine"
    class="super-flow__mark-line">
  </canvas>
</template>

<script>
export default {
  props: {
    width: {
      type: Number,
      default: 0
    },
    height: {
      type: Number,
      default: 0
    },
    markLine: Array,
    markColor: String
  },
  mounted () {
    // this.$refs.markLine和this.markLine是不同的，前者是html元素，后者是props，注意区分。
    this.$refs.markLine.height = this.height
    this.$refs.markLine.width = this.width
    this.draw()
  },
  methods: {
    draw () {
      // 从实现来看，markLine.vue并不只是专门画十字虚线，而是根据传入的数组画线，
      // 这可能是考虑有时候只画一条线，有时候画两条。但是只看实现，可以任意画线。
      const ctx = this.$el.getContext('2d')
      ctx.clearRect(0, 0, this.width, this.height)
      ctx.strokeStyle = this.markColor
      ctx.lineWidth = 1
      ctx.setLineDash([4, 2])
      this.markLine.forEach(([start, end]) => {
        ctx.beginPath()
        ctx.moveTo(...start)
        ctx.lineTo(...end)
        ctx.stroke()
      })
    }
  },
  watch: {
    markLine () { // 这里监视的是props中的markLine
      this.draw()
    }
  }
}
</script>

<style lang="less">
.super-flow__mark-line {
  position : absolute;
  z-index  : 0;
  border   : 1px solid transparent;
}
</style>
