<!--
 * User: CHT
 * Date: 2020/5/27
 * Time: 9:52
-->
<template>
  <div class="super-flow-base-demo">
    <super-flow
      ref="superFlow"
      :relation-mark="relationMark"
      :start-mark="startMark"
      :end-mark="endMark"
      :node-list="nodeList"
      :link-list="linkList"
      :template-node-list="templateNodeList"
      :origin="origin"
      :graph-menu="graphMenuList"
      :node-menu="nodeMenuList"
      :link-menu="linkMenuList"
      :enter-intercept="enterIntercept"
      :output-intercept="outputIntercept"
      :link-desc="linkDesc">
      <!-- node的内容需要用户定义，菜单有默认内容（也可以自定义） -->
      <!-- v-slot:node="{meta, node}：具名插槽 node，并从中获得 meta 和 node -->
      <template v-slot:node="{node}">
        <div :class="`flow-node flow-node-${node.meta.prop}`">
          <header class="header">
            {{ node.meta.name }}
          </header>
          <section class="section">
            {{ node.meta.desc }}
          </section>
        </div>
      </template>

      <!-- nodePannel 中的 templateNode -->
      <template v-slot:templateNode="{node}">
        <div :class="`flow-node flow-node-${node.meta.prop}`">
          <header class="header">
            {{ node.meta.name }}
          </header>
          <section class="section">
            {{ node.meta.desc }}
          </section>
        </div>
      </template>
      
    </super-flow>
  </div>
</template>

<script>
const relationMark = 'a'
const startMark = 'b'
const endMark = 'c'
const drawerType = {
  node: 0,
  link: 1
}

export default {
  data () {
    return {
      drawerType,
      relationMark,
      startMark,
      endMark,
      // 以下注释掉的部分没有任何地方用到，意义不明，可能是未实现的坑
      // drawerConf: {
      //   title: '',
      //   visible: false,
      //   type: null,
      //   info: null,
      //   open: (type, info) => {
      //     const conf = this.drawerConf
      //     conf.visible = true
      //     conf.type = type
      //     conf.info = info
      //     if (conf.type === drawerType.node) {
      //       conf.title = '节点'
      //       if (this.$refs.nodeSetting) this.$refs.nodeSetting.resetFields()
      //       this.$set(this.nodeSetting, 'name', info.meta.name)
      //       this.$set(this.nodeSetting, 'desc', info.meta.desc)
      //     } else {
      //       conf.title = '连线'
      //       if (this.$refs.linkSetting) this.$refs.linkSetting.resetFields()
      //       this.$set(this.linkSetting, 'desc', info.meta ? info.meta.desc : '')
      //     }
      //   },
      //   cancel: () => {
      //     this.drawerConf.visible = false
      //     if (this.drawerConf.type === drawerType.node) {
      //       this.$refs.nodeSetting.clearValidate()
      //     } else {
      //       this.$refs.linkSetting.clearValidate()
      //     }
      //   }
      // },
      // linkSetting: {
      //   desc: '',
      //   resetFields: () => null
      // },
      // nodeSetting: {
      //   name: '',
      //   desc: '',
      //   clearValidate: () => null
      // },

      // origin: [681, 465], // 流程图区域会有一个逻辑坐标系，node,link等坐标都是基于坐标系原点定位的。
                          // 这个oringin就是坐标系原点在实际div中的位置，坐标系的x轴朝左，y轴朝下
                          // 但是这个 origin 系统是真的傻呗，建议删掉
      origin: [0,0],
      nodeList: [],
      linkList: [],
      templateNodeList: [],

      graphMenuList: [
        [
          {
            label: '开始节点',
            disable (graph) {
              return !!graph.nodeList.find(node => node.meta.prop === 'start')
            },
            selected: (graph, coordinate) => {
              const start = graph.nodeList.find(node => node.meta.prop === 'start')
              if (!start) {
                graph.addNode({
                  width: 100,
                  height: 80,
                  coordinate: coordinate,
                  meta: {
                    prop: 'start',
                    name: '开始节点'
                  }
                })
              }
            }
          },
          {
            label: '条件节点',
            disable: false,
            selected: (graph, coordinate) => {
              graph.addNode({
                width: 160,
                height: 80,
                coordinate: coordinate,
                meta: {
                  prop: 'condition',
                  name: '条件节点'
                }
              })
            }
          },
          {
            label: '审批节点',
            disable: false,
            selected: (graph, coordinate) => {
              graph.addNode({
                width: 160,
                height: 80,
                coordinate: coordinate,
                meta: {
                  prop: 'approval',
                  name: '审批节点'
                }
              })
            }
          },
          {
            label: '抄送节点',
            disable: false,
            selected: (graph, coordinate) => {
              graph.addNode({
                width: 160,
                height: 80,
                coordinate: coordinate,
                meta: {
                  prop: 'cc',
                  name: '抄送节点'
                }
              })
            }
          },
          {
            label: '结束节点',
            disable (graph) {
              return !!graph.nodeList.find(point => point.meta.prop === 'end')
            },
            selected: (graph, coordinate) => {
              graph.addNode({
                width: 80,
                height: 50,
                coordinate: coordinate,
                meta: {
                  prop: 'end',
                  name: '结束节点'
                }
              })
            }
          }
        ],
        [
          {
            label: '打印数据',
            selected: (graph, coordinate) => {
              console.log(JSON.stringify(graph.toJSON(), null, 2))
            }
          },
          {
            label: '全选',
            selected: (graph, coordinate) => {
              graph.selectAll()
            }
          }
        ]
      ],
      nodeMenuList: [
        [
          {
            label: '删除',
            disable: false,
            hidden (node) {
              return node.meta.prop === 'start'
            },
            selected (node, coordinate) {
              node.remove()
            }
          }
        ],
        [
          {
            label: '编辑',
            selected: (node, coordinate) => {
              console.log(node, coordinate)
            }
          }
        ]
      ],
      linkMenuList: [
        [
          {
            label: '删除',
            disable: false,
            selected: (link, coordinate) => {
              link.remove()
            }
          }
        ],
        [
          {
            label: '编辑',
            disable: false,
            selected: (link, coordinate) => {
              console.log(link, coordinate)
            }
          }
        ]
      ],
    }
  },
  created () {
    const nodeList = [
      {
        'key': 'nodeS3WgFnzCI15X58Qw', // 这个似乎与a:'nodeS3WgFnzCI15X58Qw'意思一样
        'width': 100,
        'height': 80,
        'coordinate': [-644+681, -148+465],
        'meta': { // meta被插槽向上传递
          'prop': 'start',
          'name': '开始节点'
        }
      },
      {
        'key': 'nodefHsy9uJObPtdHZv1',
        'width': 160,
        'height': 80,
        'coordinate': [-200+681, -148+465],
        'meta': {
          'prop': 'approval',
          'name': '审批节点',
          'desc': '111111'
        }
      },
      {
        'key': 'nodeni9QOqT3mI7hsMau',
        'width': 160,
        'height': 80,
        'coordinate': [-442+681, -275+465],
        'meta': {
          'prop': 'condition',
          'name': '条件节点'
        }
      },
      {
        'key': 'nodeZBK0ZPpgMe1exezE',
        'width': 160,
        'height': 80,
        'coordinate': [-200+681, -275+465],
        'meta': {
          'prop': 'approval',
          'name': '审批节点'
        }
      },
      {
        'key': 'nodeqkK9zjcDz53xKRlK',
        'width': 160,
        'height': 80,
        'coordinate': [34+681, -209+465],
        'meta': {
          'prop': 'cc',
          'name': '抄送节点'
        }
      },
      {
        'key': 'nodeDhVU6w2KbEnJCjZs',
        'width': 80,
        'height': 50,
        'coordinate': [286+681, -133+465],
        'meta': {
          'prop': 'end',
          'name': '结束节点'
        }
      },
      {
        'key': 'nodesyxisLH1hJDdPsxx',
        'width': 160,
        'height': 80,
        'coordinate': [34+681, -75+465],
        'meta': {
          'prop': 'cc',
          'name': '抄送节点'
        }
      },
      {
        'key': 'node0aiA9VuhjkiAdZCs',
        'width': 160,
        'height': 80,
        'coordinate': [-200+681, -2+465],
        'meta': {
          'prop': 'approval',
          'name': '审批节点'
        }
      },
      {
        'key': 'nodeG3WeFnzCI15X58Qw',
        'width': 160,
        'height': 80,
        'coordinate': [-442+681, -2+465],
        'meta': {
          'prop': 'condition',
          'name': '条件节点'
        }
      },
      {
        'key': 'node7WXbwOR6kSFD53Hf',
        'width': 160,
        'height': 80,
        'coordinate': [-442+681, -148+465],
        'meta': {
          'prop': 'condition',
          'name': '条件节点'
        }
      }
    ]
    const linkList = [
      {
        'key': 'linkcs9ZhumWeTHrtUy8',
        'start': 'nodeS3WgFnzCI15X58Qw',
        'end': 'nodeni9QOqT3mI7hsMau',
        'startAt': [100, 40], // 这个坐标是，以起点node右上角为坐标原点时，link起点的坐标（node宽100高80，因此该点为node右侧中点）
        'endAt': [0, 40],
        'meta': null
      },
      {
        'key': 'linkBDld5rDBw4C6kiva',
        'start': 'nodefHsy9uJObPtdHZv1',
        'end': 'nodeqkK9zjcDz53xKRlK',
        'startAt': [160, 40],
        'endAt': [0, 40],
        'meta': null
      },
      {
        'key': 'linkA0ZZxRlDI9AOonuq',
        'start': 'node7WXbwOR6kSFD53Hf',
        'end': 'nodefHsy9uJObPtdHZv1',
        'startAt': [160, 40],
        'endAt': [0, 40],
        'meta': null
      },
      {
        'key': 'linkhCKTpRAf89gcujGS',
        'start': 'nodeni9QOqT3mI7hsMau',
        'end': 'nodeZBK0ZPpgMe1exezE',
        'startAt': [160, 40],
        'endAt': [0, 40],
        'meta': null
      },
      {
        'key': 'link2o7VZ7DRaSFKtB0g',
        'start': 'nodeqkK9zjcDz53xKRlK',
        'end': 'nodeDhVU6w2KbEnJCjZs',
        'startAt': [160, 40],
        'endAt': [0, 25],
        'meta': null
      },
      {
        'key': 'linkII013ovDctUDuPLu',
        'start': 'nodeS3WgFnzCI15X58Qw',
        'end': 'nodeG3WeFnzCI15X58Qw',
        'startAt': [100, 40],
        'endAt': [0, 40],
        'meta': null
      },
      {
        'key': 'link6MOmsq1EqzlWcG1n',
        'start': 'nodeZBK0ZPpgMe1exezE',
        'end': 'nodeqkK9zjcDz53xKRlK',
        'startAt': [160, 40],
        'endAt': [0, 40],
        'meta': null
      },
      {
        'key': 'link52SczSXHmuyKDzRU',
        'start': 'nodesyxisLH1hJDdPsxx',
        'end': 'nodeDhVU6w2KbEnJCjZs',
        'startAt': [160, 40],
        'endAt': [0, 25],
        'meta': null
      },
      {
        'key': 'link2hBQDTuIG4ZFYyE0',
        'start': 'node0aiA9VuhjkiAdZCs',
        'end': 'nodesyxisLH1hJDdPsxx',
        'startAt': [160, 40],
        'endAt': [0, 40],
        'meta': null
      },
      {
        'key': 'linkrwdW87FmOma5rPVo',
        'start': 'nodeG3WeFnzCI15X58Qw',
        'end': 'node0aiA9VuhjkiAdZCs',
        'startAt': [160, 40],
        'endAt': [0, 40],
        'meta': null
      },
      {
        'key': 'linknL75dQV0AWZA85sq',
        'start': 'nodeS3WgFnzCI15X58Qw',
        'end': 'node7WXbwOR6kSFD53Hf',
        'startAt': [100, 40],
        'endAt': [0, 40],
        'meta': null
      }
    ]
    const templateNodeList = [
      {
        'key': 'specialStartNode-29f8hj34u9fh4',
        'width': 160,
        'height': 80,
        'meta': {
          'prop': 'start',
          'name': '开始节点'
        }
      },
      {
        'key': 'node7WXbwOR6kSFD53Hf',
        'width': 160,
        'height': 80,
        'meta': {
          'prop': 'condition',
          'name': '条件节点'
        }
      },
      {
        'key': 'specialStartNode-fHsy9uJObPtdHZv1',
        'width': 160,
        'height': 80,
        'meta': {
          'prop': 'approval',
          'name': '审批节点',
        }
      },
      {
        'key': 'specialStartNode-qkK9zjcDz53xKRlK',
        'width': 160,
        'height': 80,
        'meta': {
          'prop': 'cc',
          'name': '抄送节点'
        }
      },
      {
        'key': 'specialStartNode-DhVU6w2KbEnJCjZs',
        'width': 80,
        'height': 50,
        'meta': {
          'prop': 'end',
          'name': '结束节点'
        }
      },
    ]

    setTimeout(() => {
      this.nodeList = nodeList
      this.linkList = linkList
      this.templateNodeList = templateNodeList
    }, 100)//设置100还不如设置0，反正就是抛出微任务
  },
  methods: {
    enterIntercept (formNode, toNode, graph) {// formNode-->fromNode，劫持拉线结束事件（原理是返回false使事件不处理），使从其它node向start node拉线时不处理
      const formType = formNode.meta.prop
      switch (toNode.meta.prop) {
        case 'start':
          return false
        case 'approval':
          return [
            'start',
            'approval',
            'condition',
            'cc'
          ].includes(formType)
        case 'condition':
          return [
            'start',
            'approval',
            'condition',
            'cc'
          ].includes(formType)
        case 'end':
          return [
            'approval',
            'cc'
          ].includes(formType)
        default:
          return true
      }
    },
    outputIntercept (node, graph) {//劫持拉线开始事件（实际原理是使节点不能拉线），使从end node拉线不处理，经过层层赋值最后赋值给node.vue的output
      return !(node.meta.prop === 'end')
    },
    linkDesc (link) {
      return link.meta ? link.meta.desc : ''
    }
  }
}
</script>

<style lang="less">
.super-flow-base-demo {
  width            : 100%;
  height           : 700px;
  margin           : 0 auto;
  background-color : #f5f5f5;

  .super-flow__node {
    .flow-node {
      .header {
        font-size   : 14px;
        height      : 32px;
        line-height : 32px;
        padding     : 0 12px;
        color       : #ffffff;
      }

      .section {
        text-align  : center;
        line-height : 20px;
        overflow    : hidden;
        padding     : 0 12px;
        word-break  : break-all;
      }

      &.flow-node-start {
        > header {
          background-color : #55abfc;
        }
      }

      &.flow-node-condition {
        > header {
          background-color : #BC1D16;
        }
      }

      &.flow-node-approval {
        > header {
          background-color : rgba(188, 181, 58, 0.76);
        }
      }

      &.flow-node-cc {
        > header {
          background-color : #30b95c;
        }
      }

      &.flow-node-end {
        > header {
          height           : 50px;
          line-height      : 50px;
          background-color : rgb(0, 0, 0);
        }
      }
    }
  }

  .super-flow__template_node {
    .super-flow__node()
  }
}
</style>
