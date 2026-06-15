class Node {
  constructor(key, value) {
    this.key = key;
    this.value = value;
    this.left = null;
    this.right = null;
  }
}

class TreeMap {
  constructor() {
    this.root = null;
  }

  get(key) {
    let current = this.root;
    while (current !== null) {
      if (key === current.key) {
        return current.value;
      }

      if (key < current.key) {
        current = current.left;
      } else {
        current = current.right;
      }
    }

    return undefined;
  }

  has(key) {
    return this.get(key) !== undefined;
  }

  set(key, value) {
    if (!this.root) {
      this.root = new Node(key, value);
      return;
    }

    let current = this.root;
    while (true) {
      if (key === current.key) {
        current.value = value;
        return;
      }

      if (key < current.key) {
        if (current.left === null) {
          current.left = new Node(key, value);
          return;
        }
        current = current.left;
      } else {
        if (current.right === null) {
          current.right = new Node(key, value);
          return;
        }
        current = current.right;
      }
    }
  }

  keys() {
    const keys = [];

    function traverse(node) {
      if (!node) {
        return;
      }
      traverse(node.left);
      keys.push(node.key);
      traverse(node.right);
    }

    traverse(this.root);

    return keys;
  }

  entries() {
    const result = [];

    function traverse(node) {
      if (!node) {
        return;
      }
      traverse(node.left);
      result.push([node.key, node.value]);
      traverse(node.right);
    }

    traverse(this.root);

    return result;
  }

  delete(key) {
    let parent = null;
    let target = this.root;

    while (target !== null && target.key !== key) {
      parent = target;
      if (key < target.key) {
        target = target.left;
      } else {
        target = target.right;
      }
    }

    if (target === null) return;

    if (target.left === null || target.right === null) {
      const child = target.left || target.right;

      if (parent === null) {
        this.root = child;
      } else if (parent.left === target) {
        parent.left = child;
      } else {
        parent.right = child;
      }
    } else {
      let minParent = target;
      let minNode = target.right;

      while (minNode.left !== null) {
        minParent = minNode;
        minNode = minNode.left;
      }

      target.key = minNode.key;
      target.value = minNode.value;

      if (minParent === target) {
        minParent.right = minNode.right;
      } else {
        minParent.left = minNode.right;
      }
    }
  }
}

const map = new TreeMap();
map.set("banana", 3);
map.set("apple", 2);
map.set("cherry", 5);
map.set("date", 1);

console.log(map.get("apple")); // 2
console.log(map.has("banana")); // true
console.log(map.keys()); // ["apple", "banana", "cherry", "date"]

map.delete("cherry");

console.log(map.entries());

console.log("-------------------- ArrayTreeMap --------------------");

class ArrayTreeMap {
  constructor(capacity) {
    this.keys = new Array(capacity).fill(undefined);
    this.values = new Array(capacity).fill(undefined);
    this.deleted = new Array(capacity).fill(false);
    this.capacity = capacity;
  }

  #getLeft(i) {
    return 2 * i + 1;
  }

  #getRight(i) {
    return 2 * i + 2;
  }

  delete(key) {
    const index = this.getIndex(key);
    if (index !== -1) {
      this.deleted[index] = true;
    }
  }

  #resize() {
    const oldKeys = this.keys;
    const oldValues = this.values;
    const oldDeleted = this.deleted;

    this.capacity *= 2;
    this.keys = new Array(this.capacity).fill(undefined);
    this.values = new Array(this.capacity).fill(undefined);
    this.deleted = new Array(this.capacity).fill(false);

    for (let i = 0; i < oldKeys.length; i++) {
      if (oldKeys[i] !== undefined && !oldDeleted[i]) {
        this.set(oldKeys[i], oldValues[i]);
      }
    }
  }

  get(key) {
    const index = this.getIndex(key);
    return index !== -1 ? this.values[index] : undefined;
  }

  getIndex(key) {
    let i = 0;
    while (i < this.capacity && this.keys[i] !== undefined) {
      if (key === this.keys[i] && !this.deleted[i]) {
        return i;
      }

      i = key < this.keys[i] ? this.#getLeft(i) : this.#getRight(i);
    }

    return -1;
  }

  set(key, value) {
    let i = 0;
    while (i < this.capacity) {
      if (
        this.keys[i] === undefined ||
        (this.deleted[i] && key === this.keys[i])
      ) {
        this.keys[i] = key;
        this.values[i] = value;
        this.deleted[i] = false;
        return;
      }

      if (key === this.keys[i]) {
        this.values[i] = value;
        this.deleted[i] = false;
        return;
      }

      i = key < this.keys[i] ? this.#getLeft(i) : this.#getRight(i);
    }

    this.#resize();
    this.set(key, value);
  }

  keys() {
    const result = [];
    const traverse = (i) => {
      if (i >= this.capacity || this.keys[i] === undefined) {
        return;
      }

      traverse(this.#getLeft(i));
      if (!this.deleted[i]) {
        result.push(this.keys[i]);
      }
      traverse(this.#getRight(i));
    };
    traverse(0);

    return result;
  }

  entries() {
    const result = [];
    const traverse = (i) => {
      if (i >= this.capacity || this.keys[i] === undefined) {
        return;
      }

      traverse(this.#getLeft(i));
      if (!this.deleted[i]) {
        result.push([this.keys[i], this.values[i]]);
      }
      traverse(this.#getRight(i));
    };
    traverse(0);

    return result;
  }
}

const map = new ArrayTreeMap(4);

console.log("--- 1. Вставка и поиск ---");
map.set(10, "A");
map.set(5, "B");
map.set(15, "C");
map.set(3, "D");
map.set(7, "E");

console.log("get(7):", map.get(7)); // "E"
console.log("get(10):", map.get(10)); // "A"
console.log("get(99):", map.get(99)); // undefined

console.log("Keys:", map.keys()); // [3, 5, 7, 10, 15]
console.log("Entries:", map.entries()); // [[3, "D"], [5, "B"], [7, "E"], [10, "A"], [15, "C"]]

map.delete(7);
console.log(map.get(7)); // undefined
console.log(map.keys()); // [3, 5, 10, 15]

map.set(7, "NEW_E");
console.log(map.get(7)); // "NEW_E"
console.log(map.keys()); // [3, 5, 7, 10, 15]

map.set(1, "F");
map.set(20, "G");
console.log(map.keys());
