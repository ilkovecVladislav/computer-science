function siftDown(array, heapSize, rootIndex, comparator) {
  let cursor = rootIndex;
  while (true) {
    const left = 2 * cursor + 1;
    const right = 2 * cursor + 2;
    let best = cursor;

    if (left < heapSize && comparator(array[left], array[best]) > 0) {
      best = left;
    }

    if (right < heapSize && comparator(array[right], array[best]) > 0) {
      best = right;
    }

    if (best === cursor) {
      break;
    }

    [array[cursor], array[best]] = [array[best], array[cursor]];

    cursor = best;
  }
}

function buildHeap(array, comparator) {
  const lastParentIndex = Math.floor(array.length / 2) - 1;
  for (let i = lastParentIndex; i >= 0; i--) {
    siftDown(array, array.length, i, comparator);
  }
}

function heapSort(array, comparator = (a, b) => b - a) {
  buildHeap(array, comparator);
  for (let i = array.length - 1; i > 0; i--) {
    [array[0], array[i]] = [array[i], array[0]];

    siftDown(array, i, 0, comparator);
  }
}

function testHeapSort(description, input, comparator) {
  console.log(`--- Тест: ${description} ---`);
  console.log("До:", [...input]);

  heapSort(input, comparator);

  console.log("После:", input);

  console.log("------------------------------------");
}

testHeapSort("Случайные числа (возрастание)", [5, 1, 9, 3, 7], (a, b) => a - b);

testHeapSort("Уже отсортированный массив", [1, 2, 3, 4, 5], (a, b) => a - b);

testHeapSort("Массив в обратном порядке", [5, 4, 3, 2, 1], (a, b) => a - b);

testHeapSort("Массив с дубликатами", [3, 1, 3, 2, 3, 1], (a, b) => a - b);

testHeapSort("Один элемент", [10], (a, b) => a - b);
testHeapSort("Пустой массив", [], (a, b) => a - b);

testHeapSort("Сортировка по убыванию", [1, 5, 2, 8, 3], (a, b) => b - a);
