class NodeData {
  eventName: string;
  item: any;
  next: NodeData;
  constructor(eventName: string, item: any) {
    this.eventName = eventName;
    this.item = item;
    this.next = null;
  }
}

export default class Queue {
  head: NodeData;
  tail: NodeData;
  size: number;

  constructor() {
    this.head = null;
    this.tail = null;
    this.size = 0;
  }

  push(eventName: string, item: any) {
    const data = new NodeData(eventName, item);
    if (this.size === 0) {
      this.head = data;
      this.head.next = this.tail;
    } else {
      this.tail.next = data;
    }
    this.tail = data;
    this.size += 1;
  }

  length() {
    return this.size;
  }

  pop() {
    //size가 0이면 undefined를 리턴해준다.
    if (this.size === 0) {
      return undefined;
    }

    const popData = this.head;
    this.head = this.head.next;
    this.size -= 1;
    return {
      eventName: popData.eventName,
      item: popData.item,
    };
  }
}
