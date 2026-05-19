class Node {
  next = null;
  prev = null;

  #data;

  constructor(ArrayClass, capacity) {
    this.#data = new ArrayClass(capacity);
  }

  get(localIndex) {
    return this.#data[localIndex];
  }

  set(localIndex, value) {
    this.#data[localIndex] = value;
  }
}

export class Deque {
  #head = null;
  #tail = null;
  #headIndex = 0;
  #tailIndex = 0;
  #length = 0;
  #capacity;
  #ArrayClass;

  constructor(ArrayClass, capacity = 64) {
    this.#ArrayClass = ArrayClass;
    this.#capacity = capacity;
  }

  get length() {
    return this.#length;
  }

  push(value) {
    if (this.#head === null) {
      const node = new Node(this.#ArrayClass, this.#capacity);
      this.#head = node;
      this.#tail = node;
      this.#headIndex = 0;
      this.#tailIndex = 0;
    } else if (this.#tailIndex === this.#capacity) {
      const newNode = new Node(this.#ArrayClass, this.#capacity);
      this.#tail.next = newNode;
      newNode.prev = this.#tail;
      this.#tail = newNode;
      this.#tailIndex = 0;
    }

    this.#tail.set(this.#tailIndex, value);
    this.#tailIndex++;
    this.#length++;
  }

  pop() {
    if (this.length === 0) {
      return undefined;
    }

    this.#tailIndex--;
    const value = this.#tail.get(this.#tailIndex);
    this.#length--;

    if (this.#tailIndex === 0) {
      if (this.length === 0) {
        this.#head = null;
        this.#tail = null;
        this.#headIndex = 0;
        this.#tailIndex = 0;
      } else if (this.#tail.prev) {
        this.#tail = this.#tail.prev;
        this.#tail.next = null;
        this.#tailIndex = this.#capacity;
      }
    }

    return value;
  }

  unshift(value) {
    if (this.#head === null) {
      const node = new Node(this.#ArrayClass, this.#capacity);
      this.#head = node;
      this.#tail = node;
      this.#headIndex = this.#capacity - 1;
      this.#tailIndex = this.#capacity;
    } else if (this.#headIndex === 0) {
      const newNode = new Node(this.#ArrayClass, this.#capacity);
      this.#head.prev = newNode;
      newNode.next = this.#head;
      this.#head = newNode;
      this.#headIndex = this.#capacity - 1;
    }

    this.#head.set(this.#headIndex, value);
    this.#headIndex--;
    this.#length++;
  }

  shift() {
    if (this.length === 0) {
      return undefined;
    }

    const value = this.#tail.get(this.#headIndex);

    this.#headIndex++;
    this.#length--;

    if (this.#headIndex === this.#capacity) {
      if (this.length === 0) {
        this.#head = null;
        this.#tail = null;
        this.#headIndex = 0;
        this.#tailIndex = 0;
      } else if (this.#head.next) {
        this.#head = this.#head.next;
        this.#head.prev = null;
        this.#headIndex = 0;
      }
    }

    return value;
  }
}

export class DequeRealoc {
  #buffer;
  #start;
  #end;
  #length = 0;
  #ArrayClass;

  constructor(ArrayClass, capacity = 4) {
    this.#ArrayClass = ArrayClass;
    const actualCapacity = Math.max(4, capacity >>> 0);
    this.#buffer = new this.#ArrayClass(actualCapacity);
    this.#start = Math.floor(actualCapacity / 2);
    this.#end = this.#start;
  }

  get capacity() {
    return this.#buffer.length;
  }

  get length() {
    return this.#length;
  }

  unshift(value) {
    if (this.#start <= 0) {
      const newCap =
        this.#length === this.capacity ? this.capacity * 2 : this.capacity;
      this.resize(newCap);
    }
    this.#start--;
    this.#buffer[this.#start] = value;
    this.#length++;
    return this.length;
  }

  push(value) {
    if (this.#end >= this.capacity) {
      const newCap =
        this.#length === this.capacity ? this.capacity * 2 : this.capacity;
      this.resize(newCap);
    }
    this.#buffer[this.#end] = value;
    this.#end++;
    this.#length++;
    return this.length;
  }

  shift() {
    if (this.#length === 0) return undefined;

    const value = this.#buffer[this.#start];
    this.#buffer[this.#start] = undefined;
    this.#start++;
    this.#length--;
    return value;
  }

  pop() {
    if (this.#length === 0) return undefined;

    this.#end--;
    const value = this.#buffer[this.#end];
    this.#buffer[this.#end] = undefined;
    this.#length--;
    return value;
  }

  resize(newCapacity = this.#length) {
    if (newCapacity < this.#length) {
      newCapacity = this.#length;
    }

    const newBuffer = new this.#ArrayClass(newCapacity);
    const offset = Math.floor((newCapacity - this.#length) / 2);

    for (let i = 0; i < this.#length; i++) {
      newBuffer[offset + i] = this.#buffer[this.#start + i];
    }

    this.#buffer = newBuffer;
    this.#start = offset;
    this.#end = offset + this.#length;
  }
}
