<!--
 * User: CHT
 * Date: 2020/5/25
 * Time: 9:12
-->
<template>
  <div class="super-flow__menu-container">
    <!-- 右键菜单被创建出来时，并不会默认获得焦点（只有点击一次后才会获得焦点），所以需要一个全屏遮罩层，帮助在未点击过菜单的情况下关闭菜单 -->
    <div
      v-show="visible"
      class="flow__menu-mask"
      @mousemove.stop.prevent
      @mousedown="close">
    </div>
    <!-- 元素的位置由style控制，所以将style的值绑定响应式变量？感觉确实是个不错的想法 -->
    <ul
      v-show="visible"
      tabindex="-1"
      class="super-flow__menu"
      @mousemove.stop.prevent
      @contextmenu.prevent.stop
      @blur="close"
      :style="style">
      <!-- 上面的@blur不必担心与li焦点冲突，普通的div，span，li等元素节点是不能直接获取焦点 -->
      <template v-for="subList in list">
        <li
          class="super-flow__menu-item"
          v-for="subItem in subList"
          :class="{'is-disabled': subItem.disable}"
          @click="select(subItem)">
          <!-- 如果需要传入内容取代默认模板，则把subItem塞给那个内容的item属性中 -->
          <slot :item="subItem">
            <span class="super-flow__menu-item-icon"></span>
            <span class="super-flow__menu-item-content">
              {{ subItem.label }}
            </span>
          </slot>
        </li>
        <li class="super-flow__menu-line"></li>
      </template>
    </ul>
  </div>

</template>

<script>
import { vector } from './utils'

export default {
  props: {
    graph: Object,
    visible: {
      type: Boolean,
      default: false
    },
    list: {
      type: Array,
      default: () => []
    },
    position: {
      type: Array,
      default: () => [0, 0]
    },
    source: {
      type: Object,
      default: () => ({})
    }
  },
  computed: {
    style () {
      return {
        left: this.position[0] + 'px',
        top: this.position[1] + 'px'
      }
    }
  },
  // 菜单的逻辑：1.构造抽象菜单items结构（包括了菜单项及对应回调）；2.全局graph接收items结构；
  // 3.节点触发菜单事件，要求全局graph为其构造菜单组件，并传入节点和items；
  // 4.菜单组件根据items构造菜单，每个菜单项绑定一个subitem；5.菜单项被点击调用item的事件回调，同时传入节点。
  methods: {
    select (subItem) {
      if (subItem.disable) return
      this.$emit('update:visible', false)

      subItem.selected(
        this.source,  // source就代表触发事件的节点
        vector(this.position)
          .minus(this.graph.origin)
          .end
      )
    },
    close (evt) {
      this.$emit('update:visible', false)
    },
  },
  watch: {
    // 这个visible不明白有什么用，似乎注释了也不影响菜单的正常显示与消失
    visible () {
      if (this.visible) {
        this.$nextTick(() => this.$el.focus())
      }
    }
  }
}
</script>

<style lang="less">

.super-flow__menu-container {
  @z-index : 10;

  .super-flow__menu {
    @menu-width      : 180px;
    @height          : 26px;

    position         : absolute;
    outline          : none;
    width            : @menu-width;
    padding          : 4px 0;
    border           : 1px solid rgb(180, 180, 180);
    box-shadow       : 0 8px 16px 0 rgba(0, 0, 0, 0.3);
    overflow         : hidden;
    border-radius    : 3px;
    z-index          : @z-index;
    background-color : #ffffff;
    margin           : 0;


    &-item {
      @padding    : 4px;
      @width      : @menu-width - 2px - @padding * 2;
      @icon-size  : @height;


      user-select : none;
      box-sizing  : content-box;

      width       : @width;
      min-height  : @height;
      line-height : @height;
      cursor      : pointer;
      position    : relative;
      padding     : 0 @padding;

      &:last-child {
        margin : 0;

        &:after {
          display : none;
        }
      }

      &:hover {
        background-color : #eeeeee;
      }

      &-icon {
        float  : left;
        width  : @icon-size;
        height : @icon-size;
      }

      &-content {
        float       : left;
        display     : inline-block;
        color       : #333333;
        font-size   : 14px;
        line-height : @height;
        width       : @width - @icon-size;
        font-weight : normal;
      }

      > div {
        position : absolute;
        top      : 0;
        left     : 0;
        right    : 0;
        bottom   : 0;
      }

      &.is-disabled {
        cursor : no-drop;

        > span {
          color : #999999;
        }

        &:hover {
          background-color : transparent;
        }
      }
    }

    &-line {
      width         : 100%;
      margin        : 4px 0;
      border-bottom : 1px solid rgb(180, 180, 180);
      height        : 0;

      &:last-child {
        display : none;
      }
    }
  }

  .flow__menu-mask {
    content          : '';
    position         : fixed;
    top              : 0;
    bottom           : 0;
    right            : 0;
    left             : 0;
    z-index          : @z-index;
    background-color : transparent;
  }
}

</style>
