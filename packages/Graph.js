/**
 * User: CHT
 * Date: 2020/5/8
 * Time: 14:00
 */

import GraphEvent from './GraphEvent'
import GraphNode from './GraphNode'
import GraphLink from './GraphLink'
import GraphPannel from './GraphPannel'
import GraphHistory from './GraphHistory'

import {
  mark, // 这个mark个人感觉有点多余，用户不应该需要自定义mark的名称，定死就行。
  arrayReplace
} from './utils'

// graph 保管所有的node和link，增删node和link都要通过graph进行。
class Graph extends GraphEvent {
  constructor(options) {
    const {
      relationMark,
      startMark,
      endMark,
      nodeList = [],
      linkList = [],
      pannelList = [],
      templateNodeList = [],
      origin
    } = options

    super()

    Object.assign(mark, {
      relationMark,
      startMark,
      endMark
    })

    this.nodeList = []
    this.linkList = []
    this.pannelList = []
    this.templateNodeList = []

    this.origin = origin

    this.mouseOnLink = null // 目前鼠标在哪个link中，该变量暴露给link.vue文件，在界面事件发生时配置
    this.mouseonNode = null // 目前鼠标在哪个node中，该变量暴露给node.vue文件，在界面事件发生时配置
    this.mouseOnPannel = null

    this.graphSelected = false // 为全选框的焦点问题专门配置的项
    this.maskBoundingClientRect = {} // 为全选框的焦点问题专门配置的项

    this.initNode(nodeList)
    this.initLink(linkList)
    this.initPannelList(pannelList)
    this.initTemplateNodeList(templateNodeList)

    this.history = new GraphHistory(this)
  }

  pointMap() {// 根据nodeList构造一个临时的map根据nodeId索引node，用于临时的高效索引，不如叫nodeMap
    const map = {}
    this.nodeList.forEach(point => {
      map[point.key] = point
    })
    return map
  }

  initNode(nodeList) {  // 创建新的nodeList替换已有的nodeList
    arrayReplace(this.nodeList, nodeList.map(node => this.createNode(node)))
    return this.nodeList
  }

  initLink(linkList) {  // 根据用户参数linkLinst创建graph需要的linkList
    // example/App.vue中传来的linkList样例：
    // [{a:'linkxxx',b:'nodexxxx',c:'nodexxx',endAt:[x,y],startAt[x,y],meta:null},....]
    // 注意，example/App.vue中 mark 将会被赋值为 {relationMark: 'a', startMark: 'b', endMark: 'c'}

    const list = []

    linkList.forEach(link => {

      const {
        startAt = [0, 0],
        endAt = [0, 0],
        meta = null
      } = link
      const startId = link.start || ''
      const endId = link.end || ''
      const pointMap = this.pointMap()//这里暗示了必须先有node才能有link
      const start = pointMap[startId]
      const end = pointMap[endId]
      if (start && end) {
        list.push(
          this.createLink({
            start,
            end,
            meta,
            startAt,
            endAt
          })
        )
      }
    })

    arrayReplace(this.linkList, list)

    return this.linkList
  }

  initPannelList(pannelList) {
    arrayReplace(this.pannelList, pannelList.map(pannel => this.createPannel(pannel)))
    return this.pannelList
  }

  initTemplateNodeList(templateNodeList) {
    arrayReplace(this.templateNodeList, templateNodeList.map(node => this.createNode(node)))
    return this.templateNodeList
  }

  createNode(options) {
    return new GraphNode(options, this)
  }

  createLink(options) {
    return new GraphLink(options, this)
  }

  createPannel(options) {
    return new GraphPannel(options, this)
  }

  addNode(options) {
    // 判断传入的是node还是node的配置，是配置则根据配置创建node
    const node = options.constructor === GraphNode
      ? options
      : this.createNode(options)

    this.nodeList.push(node)

    this.history.push('addNode',[node])

    return node
  }

  addLink(options) {
    const newLink = options.constructor === GraphLink
      ? options
      : this.createLink(options)

    const currentLink = this.linkList.find(item => {
      return item.start === newLink.start && item.end === newLink.end
    })

    if (currentLink) {  // 如果存在已有link的开始结束node与newLink相同，则变为修改已有link的起止坐标（也就是说通过这个接口添加node时，不能使两个node间存在多个link）
      currentLink.startAt = newLink.startAt
      currentLink.endAt = newLink.endAt
    } else if (newLink.start && newLink.end) {
      this.linkList.push(newLink)
    }

    return newLink
  }

  addPannel(options) {
    const pannel = options.constructor === GraphPannel
      ? options
      : this.createPannel(options)
      
    this.pannelList.push(pannel)
    return pannel
  }

  removeNode(node) {
    const idx = this.nodeList.indexOf(node)
    let deletedLinkList=[]  // 历史记录使用
    this.linkList.filter(link => {  // 移除node的同时移除相关的link
      return link.start === node || link.end === node
    }).forEach(link => {
      deletedLinkList.push(this.removeLink(link))
    })

    this.nodeList.splice(idx, 1)

    this.history.push('removeNode',[node,deletedLinkList])

    // 为什么这里没有像removeLink一样初始化mouseOnNode?
    return node
  }

  removeLink(link) {
    const idx = this.linkList.indexOf(link)
    this.linkList.splice(idx, 1)
    if (this.mouseOnLink === link) {  // 为什么removeNode没有像这里一样初始化mouseOnNode?
      this.mouseOnLink = null
    }
    return link
  }

  removePannel(pannel) {
    const idx = this.pannelList.indexOf(pannel)
    this.pannelList.splice(idx, 1)
    if (this.mouseOnPannel === pannel) {  // 为什么removeNode没有像这里一样初始化mouseOnNode?
      this.mouseOnPannel = null
    }
    return pannel
  }

  toLastNode(idx) { // 将指定idx的node放到nodeList的最后一位，目前不知道有何作用，按道理说id才是唯一标识，idx没有意义，感觉是个未填坑
    const nodeList = this.nodeList
    nodeList.splice(
      nodeList.length - 1, 0,
      ...nodeList.splice(idx, 1)
    )
  }

  toLastLink(idx) { // 将指定idx的link放到link的最后一位，目前不知道有何作用，按道理说id才是唯一标识，idx没有意义，感觉是个未填坑
    const linkList = this.linkList
    linkList.splice(
      linkList.length - 1, 0,
      ...linkList.splice(idx, 1)
    )
  }

  toJSON() {  // 目前只用于打印，有机会变为加载程序
    return {
      origin: this.origin,
      nodeList: this.nodeList.map(node => node.toJSON()),//定义在GraphNode.js中
      linkList: this.linkList.map(link => link.toJSON())
    }
  }

  selectAll() { // 计算描述全选框位置的结构体maskBoundingClientRect的取值
    const nodeList = this.nodeList
    const margin = 20
    // 通过node定位，
    this.maskBoundingClientRect = {
      top: Math.min(
        ...nodeList.map(
          node => node.center[1] - node.height / 2)
      ) - margin,

      right: Math.max(
        ...nodeList.map(
          node => node.center[0] + node.width / 2)
      ) + margin,

      bottom: Math.max(
        ...nodeList.map(
          node => node.center[1] + node.height / 2)
      ) + margin,

      left: Math.min(
        ...nodeList.map(
          node => node.center[0] - node.width / 2)
      ) - margin
    }

    this.graphSelected = true
  }

}

export default Graph
