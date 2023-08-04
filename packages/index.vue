<!--
 * User: CHT
 * Date: 2020/5/27
 * Time: 9:52

<!--
- Graph.js保存所有的逻辑实体（GraphLink.js,GraphNode.js等），提供增加、删除逻辑实体的方法;
- 逻辑实体中存储了位置信息，如果要改变其逻辑位置，请直接操作逻辑实体；
- xxx.vue是UI组件，与逻辑实体一一对应，根据逻辑实体中的位置信息确定自己的位置；
- index.vue 中监听了各个UI组件的事件，实现一些全局处理（例如菜单）；
- 暴露给外层使用的是逻辑实体。
-->
<template>
  <div
    class="super-flow"
    ref="flow-canvas"
    @contextmenu.prevent.stop="contextmenu"
    @mousedown.left="rootLeftMousedown"
  >
    <!-- contextmenu 事件会在用户尝试打开上下文菜单时被触发。该事件通常在鼠标点击右键或者按下键盘上的菜单键时被触发 -->

    <!-- 从一个节点到另一个节点拉连线时的线 -->
    <graph-line
      v-if="temEdgeConf.visible"
      :padding="linkPadding"
      :graph="graph"
      :link="temEdgeConf.link"
      :link-base-style="linkBaseStyle"
      :link-desc="linkDesc"
      :link-style="linkStyle"
    />

    <!-- 已经创建的node间的link -->
    <graph-line
      v-for="(edge, idx) in graph.linkList"
      :index="idx"
      :padding="linkPadding"
      :graph="graph"
      :link="edge"
      :key="edge.key"
      :link-base-style="linkBaseStyle"
      :link-desc="linkDesc"
      :link-style="linkStyle"
    />

    <!-- 拖动节点时的对齐线 -->
    <mark-line
      v-if="moveNodeConf.isMove && hasMarkLine"
      :width="clientWidth"
      :height="clientHeight"
      :mark-color="markLineColor"
      :markLine="moveNodeConf.markLine"
    />

    <!-- 节点 -->
    <graph-node
      v-for="(node, idx) in graph.nodeList"
      :index="idx"
      :node="node"
      :graph="graph"
      :key="node.key"
      :is-move="node === moveNodeConf.node"
      :is-tem-edge="temEdgeConf.visible"
      :node-intercept="nodeIntercept(node)"
      :line-drop="linkAddable"
      :node-drop="draggable"
      @node-mousedown="nodeMousedown"
      @node-mouseenter="nodeMouseenter"
      @node-mouseleave="nodeMouseleave"
      @node-mouseup="nodeMouseup"
      @side-mousedown="sideMousedown"
      @node-contextmenu="nodeContextmenu"
    >
    <!-- 传递 App.vue 传来的 <template> 给 Node.vue -->
      <template>
        <!-- 这里 slot 中的 :node="node" 是直接从 v-for="(node,key) in xxx" 拿的 node，下层传来的 node 并没被 template 接收 --> 
        <slot name="node" :node="node"> </slot>
      </template>
    </graph-node>

    <!-- 可拖拽节点 面板 -->
    <graph-pannel
      v-for="(pannel, idx) in graph.pannelList"
      :index="idx"
      :key="pannel.id"
      :graph="graph"
      :pannel="pannel"
      @template-node-mousedown="onTemplateNodeMousedown"
    >
      <!-- 套娃1：插入可拖拽面板 -->
      <template>
        <graph-node-pannel
          :graph="graph"
        >
          <!-- 套娃2：插入节点 -->
          <!-- 接收 templateNode 传来的node，再传给 slot -->
          <template v-slot:default="{node}">
            <slot name="templateNode" :node="node"> </slot>
          </template>
        </graph-node-pannel>
      </template>
    </graph-pannel>

    <!-- 右键菜单 -->
    <graph-menu
      :visible.sync="menuConf.visible"
      :graph="graph"
      :position="menuConf.position"
      :list="menuConf.list"
      :source="menuConf.source"
    >
      <template v-slot="{ item }">
        <slot name="menuItem" :item="item"> </slot>
      </template>
    </graph-menu>

    <!-- 全选框 -->
    <div
      class="select-all__mask"
      ref="selectAllMask"
      tabindex="-1"
      :style="maskStyle"
      @blur="graph.graphSelected = false"
      v-show="graph.graphSelected"
      @mousedown="selectAllMaskMouseDown"
      @contextmenu.prevent.stop
    ></div>
  </div>
</template>

<script>
import Graph from "./Graph";
import GraphMenu from "./menu";
import GraphNode from "./node";
import GraphLine from "./link";
import MarkLine from "./markLine";
import GraphPannel from "./pannel";
import GraphNodePannel from './components/nodePannel';

import {
  getOffset,
  isIntersect,
  isBool,
  isFun,
  vector,
  debounce,
  arrayReplace,
  simpleDeepClone,
} from "./utils";

export default {
  name: "super-flow",
  props: {
    relationMark: {
      type: String,
      default: "id",
    },
    startMark: {
      type: String,
      default: "startId",
    },
    endMark: {
      type: String,
      default: "endId",
    },
    draggable: {
      type: Boolean,
      default: true,
    },
    linkAddable: {
      type: Boolean,
      default: true,
    },
    linkEditable: {
      type: Boolean,
      default: true,
    },
    hasMarkLine: {
      type: Boolean,
      default: true,
    },
    linkDesc: {
      type: [Function, null],
      default: null,
    },
    linkStyle: {
      type: [Function, null],
      default: null,
    },
    linkBaseStyle: {
      type: Object,
      default: () => ({}),
    },
    markLineColor: {
      type: String,
      default: "#55abfc",
    },
    origin: {
      type: Array,
      default: () => [0, 0],
    },
    nodeList: {
      type: Array,
      default: () => [],
    },
    linkList: {
      type: Array,
      default: () => [],
    },
    templateNodeList: {
      type: Array,
      default: () => [],
    },
    graphMenu: {
      type: Array,
      default: () => [],
    },
    nodeMenu: {
      type: Array,
      default: () => [],
    },
    linkMenu: {
      type: Array,
      default: () => [],
    },
    linkPadding: {
      type: Number,
      default: 50,
    },
    enterIntercept: {
      type: Function,
      default: () => true,
    },
    outputIntercept: {
      type: Function,
      default: () => true,
    },
  },
  data() {
    return {
      graph: new Graph({
        relationMark: this.relationMark,
        startMark: this.startMark,
        endMark: this.endMark,
        origin: this.origin,
      }),
      menuConf: {
        visible: false,
        position: [0, 0],
        source: null,
        list: [],
      },
      moveNodeConf: {
        isMove: false,
        node: null,
        offset: null,
        verticalList: [],
        horizontalList: [],
        markLine: [],
        startPosition: [],
        endPosition: [],
      },
      moveAllConf: {
        isMove: false,
        origin: [0, 0],
        downPosition: [0, 0],
        leftEdge: 9999, // 这个四个值取决于最左右上下的node，移动时所有node都不可见时则不允许移动了。
        rightEdge: 0,
        topEdge: 0,
        bottomEdge: 9999,
      },
      temEdgeConf: {
        visible: false,
        link: null,
      },
      templateNodeConf: {
        isMove: false,
        templateNode: null,
        offset: [0,0],
        jsnode: null,
      },
      loaded: false,
      clientWidth: 0,
      clientHeight: 0,
    };
  },
  components: {
    GraphMenu, // 注册驼峰命名的GraphMenu组件后，实际使用时既可以用<GraphMenu>也可以用<graph-menu>
    GraphNode,
    GraphLine,
    MarkLine,
    GraphPannel,
    GraphNodePannel,
  },
  computed: {
    maskStyle() {
      const { top, right, bottom, left } = this.graph.maskBoundingClientRect;
      return {
        width: `${right - left}px`,
        height: `${bottom - top}px`,
        top: `${top + this.graph.origin[1]}px`,
        left: `${left + this.graph.origin[0]}px`,
      };
    },
  },
  mounted() {
    // 为什么 mouseup 和 mousemove 要绑定 document 事件？想象一下滚动条，
    // 当我们点击按住滚动条时，即使鼠标在移动过程中移出了滚动条区域，滚动条依然视为被我们按住，
    // 且在区域外松开鼠标时滚动条也被正确释放，所以移动和松开需要绑定 document 事件，而点击要绑定元素事件。
    document.addEventListener("mouseup", this.docMouseup);
    document.addEventListener("mousemove", this.docMousemove);
    document.addEventListener('keydown', this.onKeydown); // 按键 canvas 捕捉不到，也只能绑 document
    this.graph.add('template-node-mousedown', this.onTemplateNodeMousedown)
    this.graph.add('template-node-mouseup', this.onTemplateNodeMouseup)
    this.$once("hook:beforeDestroy", () => {
      document.removeEventListener("mouseup", this.docMouseup);
      document.removeEventListener("mousemove", this.docMousemove);
      document.removeEventListener('keydown', this.onKeydown);
      this.graph.remove('template-node-mousedown', this.onTemplateNodeMousedown)
      this.graph.remove('template-node-mouseup', this.onTemplateNodeMouseup)
    });

    // node 移动的 redo, undo
    this.graph.history.setReverse('moveNode',this.moveNodeUndo.bind(this),this.moveNodeRedo.bind(this))

    // 创建 可拖拽 node 的 pannel
    let flowViewRect = this.$el.getBoundingClientRect()
    let flowViewleftMid = [flowViewRect.left,Math.floor((window.innerHeight-flowViewRect.top)/2)]
    this.graph.addPannel({
        thumbCoordinate: [flowViewleftMid[0]-this.graph.origin[0],flowViewleftMid[1]-this.graph.origin[1]-25],
        thumbWidth: 15,
        thumbHeight: 50,
        width: 200,
        height: 600,
        coordinate: [flowViewleftMid[0]-this.graph.origin[0],flowViewleftMid[1]-this.graph.origin[1]-300],
        meta: null
      })

    this.$nextTick(() => {
      this.graph.initNode(this.nodeList);
      this.graph.initLink(this.linkList);
      this.graph.initTemplateNodeList(this.templateNodeList)
    });
  },
  methods: {
    initMenu(menu, source) {
      // 这个会解析菜单配置，打平成menu组件需要的形式，按道理说这个并不涉及this，直接放到menu组件中也行，放这儿这相当于抽象了一层吧。
      return menu
        .map((subList) =>
          subList
            .map((item) => {
              let disable;
              let hidden;

              if (isFun(item.disable)) {
                disable = item.disable(source);
              } else if (isBool(item.disable)) {
                disable = item.disable;
              } else {
                disable = Boolean(item.disable);
              }

              if (isFun(item.hidden)) {
                hidden = item.hidden(source);
              } else if (isBool(item.hidden)) {
                hidden = item.hidden;
              } else {
                hidden = Boolean(item.hidden);
              }

              return {
                ...item,
                disable,
                hidden,
              };
            })
            .filter((item) => !item.hidden)
        )
        .filter((sublist) => sublist.length);
    },

    showContextMenu(position, list, source) {
      if (!list.length) return;
      this.$set(this.menuConf, "position", position); // 不使用this.$set也行，这些属性默认都有
      this.$set(this.menuConf, "list", list);
      this.$set(this.menuConf, "source", source);
      this.menuConf.visible = true;
    },

    rootLeftMousedown(evt) {
      // TODO：这里挺坑的，每次加一个可能的元素，就要在这里加个判断做排除
      // 应该让所有发生点击事件的组件都拦截点击事件（似乎没法实现拦截，坑1）
      // 然后 rootLeftMousedown 就只需要响应自身的点击事件即可（似乎 canvas 无法响应点击事件，坑2）
      if (
        !this.graph.mouseOnLink &&
        !this.graph.mouseonNode &&
        !this.graph.mouseOnPannel &&
        !this.templateNodeConf.isMove
      ) {
        this.moveAllConf.isMove = true;
        this.moveAllConf.origin = [...this.graph.origin];
        this.moveAllConf.downPosition = [evt.clientX, evt.clientY];
        this.graph.nodeList.forEach((node) => {
          this.moveAllConf.leftEdge = Math.min(
            this.moveAllConf.leftEdge,
            node.position[0]
          );
          this.moveAllConf.rightEdge = Math.max(
            this.moveAllConf.rightEdge,
            node.position[0] + node.width
          );
          this.moveAllConf.bottomEdge = Math.min(
            this.moveAllConf.bottomEdge,
            node.position[1]
          );
          this.moveAllConf.topEdge = Math.max(
            this.moveAllConf.topEdge,
            node.position[1] + node.height
          );
        });
      }
    },

    docMouseup(evt) {
      if (this.templateNodeConf.isMove) {
        this.onTemplateNodeMouseup(evt);
      }
      else if (this.moveNodeConf.isMove) {
        evt.stopPropagation();
        evt.preventDefault();

        this.moveNodeConf.endPosition=getOffset(evt,this.$el)
        this.graph.history.push('moveNode', [simpleDeepClone(this.moveNodeConf)])
      }

      //TODO:这里无脑结束所有点击事件，个人认为还是利用状态机，分开处理比较好，这样以后扩展不会分不清哪些代码该执行，哪些不该执行
      this.moveNodeConf.isMove = false; // 结束移动节点
      this.moveNodeConf.node = null;
      this.moveNodeConf.offset = null;
      this.startPosition = [0,0];
      this.endPosition = [0,0];
      arrayReplace(this.moveNodeConf.markLine, []);

      this.temEdgeConf.visible = false; // 结束拉线
      this.temEdgeConf.link = null;

      this.moveAllConf.isMove = false; // 结束全选移动
    },

    docMousemove(evt) {
      if (this.moveNodeConf.isMove) {
        this.moveNode(evt);
      } else if (this.temEdgeConf.visible) {
        this.moveTemEdge(evt);
      } else if (this.moveAllConf.isMove) {
        this.moveWhole(evt);
      } else if (this.templateNodeConf.isMove) {
        this.moveTemplateNode(evt);
      } else if (this.linkEditable) {
        // this.graph.dispatch({  // 目前link不再需要该事件
        //   type: 'mousemove',
        //   evt: evt
        // }, true)
      }
    },

    moveNode(evt) {
      const distance = 10;
      const conf = this.moveNodeConf;
      const origin = this.graph.origin;

      const position = vector(conf.offset) // 这里计算完，得到 node center 在逻辑坐标系中的位置
        .differ(getOffset(evt, this.$el))
        .minus(origin)
        .add([conf.node.width / 2, conf.node.height / 2]).end;

      if (this.hasMarkLine) {
        // 对齐线
        const resultList = [];
        conf.verticalList.some((vertical) => {
          // 检测是否对齐（允许distance的误差）
          const x = position[0];
          const result = vertical - distance < x && vertical + distance > x;

          if (result) {
            // 在误差范围内对齐，则修改position以对齐（实现吸附效果）
            // 计算 node center 的位置是基于最开始的偏移+鼠标位置，所以不会永远被吸附住
            position[0] = vertical;
            vertical = Math.floor(vertical);
            vertical += origin[0];
            vertical += vertical % 1 === 0 ? 0.5 : 0;
            resultList.push([
              [vertical, 0],
              [vertical, this.clientHeight],
            ]);
          }
          return result;
        });
        conf.horizontalList.some((horizontal) => {
          const y = position[1];
          const result = horizontal - distance < y && horizontal + distance > y;
          if (result) {
            position[1] = horizontal;
            horizontal = Math.floor(horizontal);
            horizontal += origin[1];
            horizontal += horizontal % 1 === 0 ? 0.5 : 0;
            resultList.push([
              [0, horizontal],
              [this.clientWidth, horizontal],
            ]);
          }
          return result;
        });

        arrayReplace(conf.markLine, resultList);
      }

      conf.node.center = position;
    },

    moveTemEdge(evt) {
      this.temEdgeConf.link.movePosition = getOffset(evt, this.$el);
    },

    moveWhole(evt) {
      // 获取相对上次事件位置的距离
      const offset = vector(this.moveAllConf.downPosition).differ([
        evt.clientX,
        evt.clientY,
      ]).end;
      // node 都超出 flow 区域时则移动无效
      // 但是为了能够移动回来，所以这里的处理是将超出方向上的偏移设为0
      if (this.moveAllConf.leftEdge + offset[0] > this.$el.clientWidth + 30) {
        offset[0] = offset[0] > 0 ? 0 : offset[0];
      }
      if (this.moveAllConf.rightEdge + offset[0] < 0 - 30) {
        offset[0] = offset[0] < 0 ? 0 : offset[0];
      }
      if (
        this.moveAllConf.bottomEdge + offset[1] >
        this.$el.clientHeight + 30
      ) {
        offset[1] = offset[1] > 0 ? 0 : offset[1];
      }
      if (this.moveAllConf.rightEdge + offset[1] < 0 - 30) {
        offset[1] = offset[1] < 0 ? 0 : offset[1];
      }
      // 移动所有节点
      this.graph.nodeList.forEach((node) => {
        node.position = vector(node.position).add(offset).end
      });
      // 移动边界
      this.moveAllConf.leftEdge += offset[0];
      this.moveAllConf.rightEdge += offset[0];
      this.moveAllConf.bottomEdge += offset[1];
      this.moveAllConf.topEdge += offset[1];
      // 更新事件位置
      this.moveAllConf.downPosition = [evt.clientX, evt.clientY];
      // 移动全局时视为移动坐标原点，这可能是这个 origin 唯一有用的地方了
      // arrayReplace(this.graph.origin,
      //   vector(this.moveAllConf.origin)
      //     .add(offset)
      //     .end
      // )
    },

    moveTemplateNode(evt) {
      // 计算点击位置相对于 canvas 的坐标以设置 left 和 top
      let offset = vector(getOffset(evt, this.$el)).minus(this.templateNodeConf.offset).end
      this.templateNodeConf.templateNode.style.left = offset[0]+"px";
      this.templateNodeConf.templateNode.style.top = offset[1]+"px";
    },

    contextmenu(evt) {
      const mouseOnLink = this.graph.mouseOnLink;
      const position = getOffset(evt);
      let list, source;

      // link的右键菜单放这里的原因是：canvas部分触发link菜单，部分触发全局菜单，最好就放到全局处理
      if (mouseOnLink && mouseOnLink.isPointInLink(position)) {
        list = this.initMenu(this.linkMenu, mouseOnLink);
        source = mouseOnLink;
      } else {
        if (mouseOnLink) this.graph.mouseOnLink = null;
        list = this.initMenu(this.graphMenu, this.graph);
        source = this.graph;
      }

      this.showContextMenu(position, list, source);
    },

    nodeMousedown(evt, node, offset) {
      //node中鼠标点击事件，node为逻辑node，offset为此时鼠标相对于node的坐标
      if (this.draggable) {
        this.clientWidth = this.$el.clientWidth;
        this.clientHeight = this.$el.clientHeight;

        this.moveNodeConf.startPosition = getOffset(evt,this.$el)

        const verticalList = this.moveNodeConf.verticalList; // 为了画对齐线，要获得node们的中心坐标
        const horizontalList = this.moveNodeConf.horizontalList;

        const centerList = this.graph.nodeList
          .filter((item) => item !== node)
          .map((node) => node.center);

        arrayReplace(
          verticalList,
          [
            // 高效搜索，将node们的垂直、水平中心坐标保存为set
            ...new Set(centerList.map((center) => center[0])),
          ].sort((prev, next) => prev - next)
        ); // 优先对齐靠左的node

        arrayReplace(
          horizontalList,
          [...new Set(centerList.map((center) => center[1]))].sort(
            (prev, next) => prev - next
          )
        );

        this.moveNodeConf.isMove = true;
        this.moveNodeConf.node = node;
        this.moveNodeConf.offset = offset;
      }
    },

    nodeMouseenter(evt, node, offset) {
      // node中鼠标进入事件，这里主要是处理临时拉线的终点
      const link = this.temEdgeConf.link;
      if (this.enterIntercept(link.start, node, this.graph)) {
        // TODO:这个是不是改成直接为每个节点配置是否能结束拉线比较好？写回调太麻烦了
        link.end = node;
        link.endAt = offset;
      }
    },

    nodeMouseleave() {
      // node中鼠标离开事件，这里主要是处理临时拉线的终点
      this.temEdgeConf.link.end = null;
    },

    nodeMouseup() {
      // node中鼠标点击松开事件，这里将临时拉线加入为实际连线
      this.graph.addLink(this.temEdgeConf.link);
    },

    nodeContextmenu(evt, node) {
      const list = this.initMenu(this.nodeMenu, node);
      if (!list.length) return;
      this.$set(this.menuConf, "position", getOffset(evt, this.$el)); // TODO：不用this.$set也行，这些属性初始化时已经存在
      this.$set(this.menuConf, "list", list);
      this.$set(this.menuConf, "source", node);
      this.menuConf.visible = true;
    },

    sideMousedown(evt, node, startAt) {
      // 创建拉线
      if (this.linkAddable) {
        // TODO：这里应该根据node的linkAddable判断吧
        const link = this.graph.createLink({
          start: node,
          startAt,
        });
        link.movePosition = getOffset(evt, this.$el);
        this.$set(this.temEdgeConf, "link", link);
        this.temEdgeConf.visible = true;
      }
    },

    nodeIntercept(node) {
      return () => this.outputIntercept(node, this.graph);
    },

    menuItemSelect() {
      this.menuConf.visible = false;
    },

    selectAllMaskMouseDown(evt) {
      this.moveAllConf.isMove = true;
      this.moveAllConf.origin = [...this.graph.origin];
      this.moveAllConf.downPosition = [evt.clientX, evt.clientY];
    },

    selectedAll() {
      this.graph.selectAll();
    },

    onTemplateNodeMousedown(evt) {
      // 嫁接一下属性，方便后面操作
      evt.mouseevent.offset=evt.offset;
      evt.mouseevent.jsnode=evt.jsnode;
      evt=evt.mouseevent;
      // 触发点击事件的可能是 node 本身，此时要取 evt.target；也可能是 node 中的元素，
      // 此时要取 evt.currentTarget （发出事件的毕竟还是 node，所以 currentTarget 一定指向 node）
      // 触发点击事件的是 node 本身时，evt.currentTarget 为 null，所以用下面的表达式即可
      let trigger = evt.currentTarget || evt.target
      // 拷贝 node
      let dragNode = trigger.cloneNode(true);
      // 设为绝对定位
      dragNode.style.position = "absolute";
      // 计算点击位置相对于 canvas 的坐标以设置 left 和 top
      let offset = vector(getOffset(evt, this.$el)).minus(evt.offset).end
      dragNode.style.left = offset[0]+"px";
      dragNode.style.top = offset[1]+"px";
      // z-style 为 4，比 pannel 高 1 级
      dragNode.style['z-index']="4";
      // 将 node 放入 canvas
      this.$el.appendChild(dragNode);
      // 设置结构体
      this.templateNodeConf.templateNode=dragNode;
      this.templateNodeConf.isMove=true;
      this.templateNodeConf.offset=evt.offset;
      this.templateNodeConf.jsnode=evt.jsnode;
    },

    onTemplateNodeMouseup(evt) {
      // 添加一个 graph node
      console.log(evt)
      this.addNode({
        width:this.templateNodeConf.jsnode.width,
        height:this.templateNodeConf.jsnode.height,
        meta:this.templateNodeConf.jsnode.meta,
        coordinate:vector(getOffset(evt, this.$el)).minus(this.templateNodeConf.offset).end,
      })
      // 移除 templateNode
      this.$el.removeChild(this.templateNodeConf.templateNode);
      this.templateNodeConf.templateNode=null;
      this.templateNodeConf.isMove=false;
      this.templateNodeConf.offset=[0,0];
    },

    toJSON() {
      return this.graph.toJSON();
    },

    getMouseCoordinate(clientX, clientY) {
      const offset = getOffset({ clientX, clientY }, this.$el);
      return vector(offset).minus(this.graph.origin).end;
    },

    addNode(options) {
      return this.graph.addNode(options);
    },

    onKeydown(evt) {
      if(evt.ctrlKey) {
        if(evt.key === 'z') {
          this.graph.history.undo()
        }
        else if(evt.key === 'y') {
          this.graph.history.redo()
        }
      }
    },

    moveNodeUndo(moveNodeConf) {
      let offset = vector(moveNodeConf.endPosition).minus(moveNodeConf.startPosition).end
      let node = this.graph.nodeList.find(node=>node.key===moveNodeConf.node.key)
      node.position=vector(node.position).minus(offset).end
    },

    moveNodeRedo(moveNodeConf) {
      let offset = vector(moveNodeConf.endPosition).minus(moveNodeConf.startPosition).end
      let node = this.graph.nodeList.find(({node})=>node.key===moveNodeConf.node.key)
      node.position=vector(node.position).add(offset).end
    }
  },
  watch: {
    "graph.graphSelected"() {
      if (this.graph.graphSelected) {
        this.$nextTick(() => {
          this.$refs.selectAllMask.focus();
        });
      }
    },
    "graph.mouseOnLink"() {
      if (this.graph.mouseOnLink) {
        document.body.style.cursor = "pointer";
      } else {
        document.body.style.cursor = "";
      }
    },
    // 虽然props是响应式的，但是其变化时并不能使graph中的origin,nodeList,linkList变化，
    // 因此需要watch这些props，在其变化时更新graph中的origin,nodeList,linkList。
    origin() {
      this.graph.origin = this.origin || [];
    },
    nodeList() {
      // 非深度监听
      this.graph.initNode(this.nodeList);
    },
    linkList() {
      this.graph.initLink(this.linkList);
    },
    templateNodeList() {
      this.graph.initTemplateNodeList(this.templateNodeList)
    }
  },
  install(Vue) {
    Vue.component(this.name, this);
  },
};
</script>

<style lang="less">
.super-flow {
  font-family: Apple System, "SF Pro SC", "SF Pro Display", "Helvetica Neue",
    Arial, "PingFang SC", "Hiragino Sans GB", STHeiti, "Microsoft YaHei",
    "Microsoft JhengHei", "Source Han Sans SC", "Noto Sans CJK SC",
    "Source Han Sans CN", sans-serif;

  position: relative;
  background-color: transparent;
  width: 100%;
  height: 100%;
  overflow: hidden;

  > .select-all__mask {
    position: absolute;
    background-color: rgba(85, 175, 255, 0.1);
    z-index: 20;
    border: 1px dashed #55abfc;
    cursor: move;
    outline: none;
  }
}
</style>
