class Matrix {
  #data;
  #rows;
  #cols;

  constructor(Type, row, col) {
    this.#data = new Type(row * col);
    this.#rows = row;
    this.#cols = col;
  }

  #getIndex(row, col) {
    if (row >= 0 && row < this.#rows && col >= 0 && col < this.#cols) {
      return row * this.#cols + col;
    }
    throw new RangeError("Index out of bounds");
  }

  get(row, col) {
    const index = this.#getIndex(row, col);
    return this.#data[index];
  }

  set(row, col, value) {
    const index = this.#getIndex(row, col);
    this.#data[index] = value;
    return value;
  }

  get size() {
    return this.#rows;
  }

  clone() {
    const copy = new Matrix(this.#data.constructor, this.#rows, this.#cols);

    copy.#data.set(this.#data);

    return copy;
  }
}

class Graph {
  data;
  directed;

  constructor(data, { directed }) {
    this.data = data;
    this.directed = directed;
  }

  hasArc(from, to) {
    if (!this.directed) {
      throw new Error("Graph is not oriented");
    }

    return !!this.data.get(from, to);
  }

  addArc(from, to, weight) {
    if (!this.directed) {
      throw new Error("Graph is not oriented");
    }

    this.data.set(from, to, weight);
  }

  removeArc(from, to) {
    if (!this.directed) {
      throw new Error("Graph is not oriented");
    }

    this.data.set(from, to, 0);
  }

  hasEdge(from, to) {
    if (this.directed === true) {
      throw new Error("Graph is oriented");
    }

    return !!this.data.get(from, to);
  }

  addEdge(from, to, weight) {
    if (this.directed === true) {
      throw new Error("Graph is oriented");
    }

    this.data.set(from, to, weight);
    this.data.set(to, from, weight);
  }

  removeEdge(from, to) {
    if (this.directed === true) {
      throw new Error("Graph is oriented");
    }

    this.data.set(from, to, 0);
    this.data.set(to, from, 0);
  }

  traverse(startNode, callback) {
    const totalNodes = this.data.size;
    const visited = new Set();
    const queue = [];

    queue.push([startNode, 0, 0]);
    visited.add(startNode);

    while (queue.length > 0) {
      const [nodeId, depth, edgeWeight] = queue.shift();

      callback({ id: nodeId, weight: edgeWeight }, depth);

      for (let neighborId = 0; neighborId < totalNodes; neighborId++) {
        const weight = this.data.get(nodeId, neighborId);
        const isNeighborConnected = weight > 0;
        const isNotVisited = !visited.has(neighborId);

        if (isNeighborConnected && isNotVisited) {
          visited.add(neighborId);
          queue.push([neighborId, depth + 1, weight]);
        }
      }
    }
  }

  transitiveClosure() {
    const totalNodes = this.data.size;

    const closureMatrix = this.data.clone();

    for (let i = 0; i < totalNodes; i++) {
      closureMatrix.set(i, i, 1);
    }

    for (let k = 0; k < totalNodes; k++) {
      for (let i = 0; i < totalNodes; i++) {
        for (let j = 0; j < totalNodes; j++) {
          if (closureMatrix.get(i, k) > 0 && closureMatrix.get(k, j) > 0) {
            closureMatrix.set(i, j, 1);
          }
        }
      }
    }

    return new Graph(closureMatrix, { directed: true });
  }
}

const matrix = new Matrix(Uint8Array, 5, 5);
const graph = new Graph(matrix, { directed: false });

graph.addEdge(0, 1, 10);
graph.addEdge(0, 2, 20);
graph.addEdge(0, 3, 30);
graph.addEdge(3, 4, 40);

graph.traverse(1, (node, depth) => {
  console.log(`Узел: ${node.id}. Глубина: ${depth}. Вес ребра: ${node.weight}`);
});

function testTransitiveClosure() {
  const matrix = new Matrix(Uint8Array, 3, 3);
  const graph = new Graph(matrix, { directed: true });

  graph.addArc(0, 1, 10);
  graph.addArc(1, 2, 20);

  console.log("До замыкания:");
  console.log("0 -> 2?", graph.hasArc(0, 2)); // false

  const closedGraph = graph.transitiveClosure();

  console.log("\nПосле замыкания:");
  console.log("0 -> 1?", closedGraph.hasArc(0, 1)); // true
  console.log("1 -> 2?", closedGraph.hasArc(1, 2)); // true
  console.log("0 -> 2?", closedGraph.hasArc(0, 2)); // true
  console.log("2 -> 0?", closedGraph.hasArc(2, 0)); // false

  console.log("0 -> 0?", closedGraph.hasArc(0, 0)); // true
}

testTransitiveClosure();
