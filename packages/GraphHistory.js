/**
 * User: xtoz
 * Date: 2023/8/3
 * Time: 11:02
 */
import History from './History'
import GraphEvent from './GraphEvent'
import GraphNode from './GraphNode'
import GraphLink from './GraphLink'
import GraphPannel from './GraphPannel'

// 为了文件简洁，把所有撤销操作函数的定义都放在这里

class GraphHistory extends History{
    constructor(graph) {
        super()
        
        this.graph = graph
        
        // 成员函数的this也能被改变
        this.setReverse('addNode',this.addNodeUndo.bind(this.graph),this.addNodeRedo.bind(this.graph))
        this.setReverse('removeNode',this.removeNodeUndo.bind(this.graph),this.removeNodeRedo.bind(this.graph))
    };

    // this 一般指向 this.graph，在 setReverse 时会 bind 它
    addNodeUndo(node) {
        const idx = this.nodeList.indexOf(node)
        this.linkList.filter(link => {  // 如果 addLink 被纳入 undo 范围的话，这步就不需要了，理论上 undo addNode 时，node 上是没有 link 的，不过目前没有把 link 纳入考虑范围，因此需要附带删除连线
            return link.start === node || link.end === node
        }).forEach(link => {
            this.removeLink(link)
        })
        this.nodeList.splice(idx, 1)
        return node
    }

    addNodeRedo(options) {
        const node = options.constructor === GraphNode
            ? options
            : this.createNode(options)
        this.nodeList.push(node)
        return node
    }

    removeNodeUndo(options) {
        const node = options.constructor === GraphNode
            ? options
            : this.createNode(options)
        this.nodeList.push(node)
        return node
    }

    removeNodeRedo(node) {
        const idx = this.nodeList.indexOf(node)
        this.linkList.filter(link => {
            return link.start === node || link.end === node
        }).forEach(link => {
            this.removeLink(link)
        })
        this.nodeList.splice(idx, 1)
        return node
    }
}

export default GraphHistory
