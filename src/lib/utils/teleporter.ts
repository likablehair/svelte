import { BROWSER } from 'esm-env';
import { createId } from '@paralleldrive/cuid2';

type TeleportingUid = string

class Teleporter {
  private bodyNode: HTMLElement | undefined
  private nodes: Record<TeleportingUid, Element> = {}

  constructor() {
    if(!BROWSER) throw new Error('cannot teleport wihout a browser running')

    this.loadBodyAndNodes()
  }

  loadBodyAndNodes() {
    this.bodyNode = document.body
    let elements = Array.from(document.getElementsByClassName('_teleported'))

    this.nodes = {}
    for(let i = 0; i < elements.length; i += 1) {
      let teleportedUid = elements[i].getAttribute('teleported-uid')
      if (!!teleportedUid) {
        this.nodes[teleportedUid] = elements[i]
      }
    }
  }

  attachNode(node: HTMLElement): TeleportingUid {
    let teleportedUid = createId()
    node.setAttribute('teleported-uid', teleportedUid)
    node.classList.add('_teleported')

    this.bodyNode?.appendChild(node)
    this.loadBodyAndNodes()

    return teleportedUid
  }

  destroyNode(uid: string) {
    let node = this.nodes[uid]
    node.remove()
  }
}

export default Teleporter