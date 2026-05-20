const STACK_HEADER_BYTE_LENGTH = 4;

const HEAP_BLOCK_SIZE_BYTE_LENGTH = 4;
const HEAP_BLOCK_STATUS_BYTE_LENGTH = 1;
const HEAP_HEADER_BYTE_LENGTH =
  HEAP_BLOCK_SIZE_BYTE_LENGTH + HEAP_BLOCK_STATUS_BYTE_LENGTH;

const HEAP_STATUS_FREE = 0;
const HEAP_STATUS_BUSY = 1;

class Pointer {
  #offset;
  #size;
  #memory;
  #memoryManager;
  #validStatus = true;

  constructor(offset, size, memory, memoryManager) {
    this.#offset = offset;
    this.#size = size;
    this.#memory = memory;
    this.#memoryManager = memoryManager;
  }

  get isValid() {
    return this.#validStatus;
  }

  invalidate() {
    this.#validStatus = false;
  }

  get size() {
    return this.#size;
  }

  get offset() {
    return this.#offset;
  }

  deref() {
    if (!this.#validStatus) throw new Error("Pointer is invalid");
    return this.#memory;
  }

  change(newBuffer) {
    if (!this.#validStatus) throw new Error("Pointer is invalid");
    if (newBuffer.byteLength !== this.#size) throw new Error("Size mismatch");

    this.#memory.set(new Uint8Array(newBuffer));
  }

  free() {
    if (!this.#validStatus) throw new Error("Double free detected!");
    this.#memoryManager.freePointer(this);
    this.invalidate();
  }
}

class Memory {
  #stackTop = 0;
  #view;
  #buffer;
  #pointers = [];
  #heapStart;

  constructor(bufferSize, { stack }) {
    this.#buffer = new ArrayBuffer(bufferSize);
    this.#view = new DataView(this.#buffer);
    this.#heapStart = stack;

    const initialHeapSize = bufferSize - stack;
    const initialBlockDataSize = initialHeapSize - HEAP_HEADER_BYTE_LENGTH;

    this.#view.setUint32(this.#heapStart, initialBlockDataSize);
    this.#view.setUint8(
      this.#heapStart + HEAP_BLOCK_SIZE_BYTE_LENGTH,
      HEAP_STATUS_FREE,
    );
  }

  push(buffer) {
    const requiredSpace = STACK_HEADER_BYTE_LENGTH + buffer.byteLength;

    if (this.#stackTop + requiredSpace > this.#heapStart) {
      throw new Error("Stack overflow: Stack reached heap boundaries");
    }

    this.#view.setUint32(this.#stackTop, buffer.byteLength);
    const dataOffset = this.#stackTop + STACK_HEADER_BYTE_LENGTH;
    const bufferData = new Uint8Array(this.#buffer);
    bufferData.set(new Uint8Array(buffer), dataOffset);
    this.#stackTop += requiredSpace;

    const pointer = new Pointer(
      dataOffset,
      buffer.byteLength,
      bufferData.subarray(dataOffset, dataOffset + buffer.byteLength),
      this,
    );

    this.#pointers.push(pointer);
    return pointer;
  }

  pop() {
    if (this.#pointers.length === 0) return;

    const lastPointer = this.#pointers.pop();
    lastPointer.invalidate();

    this.#stackTop -= lastPointer.size + STACK_HEADER_BYTE_LENGTH;
  }

  alloc(size) {
    let currentOffset = this.#heapStart;

    while (currentOffset < this.#buffer.byteLength) {
      const blockSize = this.#view.getUint32(currentOffset);
      const isBusy = this.#view.getUint8(
        currentOffset + HEAP_BLOCK_SIZE_BYTE_LENGTH,
      );

      if (isBusy === HEAP_STATUS_FREE && blockSize >= size) {
        const remainingSpace = blockSize - size;

        if (remainingSpace <= HEAP_HEADER_BYTE_LENGTH) {
          this.#view.setUint8(
            currentOffset + HEAP_BLOCK_STATUS_BYTE_LENGTH,
            HEAP_STATUS_BUSY,
          );
        } else {
          this.#view.setUint32(currentOffset, size);
          this.#view.setUint8(
            currentOffset + HEAP_BLOCK_SIZE_BYTE_LENGTH,
            HEAP_STATUS_BUSY,
          );

          const nextBlockOffset =
            currentOffset + HEAP_HEADER_BYTE_LENGTH + size;
          const nextBlockSize = remainingSpace - HEAP_HEADER_BYTE_LENGTH;

          this.#view.setUint32(nextBlockOffset, nextBlockSize);
          this.#view.setUint8(
            nextBlockOffset + HEAP_BLOCK_SIZE_BYTE_LENGTH,
            HEAP_STATUS_FREE,
          );
        }

        const dataOffset = currentOffset + HEAP_HEADER_BYTE_LENGTH;
        const bufferData = new Uint8Array(this.#buffer);

        return new Pointer(
          dataOffset,
          size,
          bufferData.subarray(dataOffset, dataOffset + size),
          this,
        );
      } else {
        currentOffset += HEAP_HEADER_BYTE_LENGTH + blockSize;
      }
    }
    throw new Error("Out of memory: Heap is full or fragmented");
  }

  freePointer(pointer) {
    const headerOffset = pointer.offset - HEAP_HEADER_BYTE_LENGTH;
    this.#view.setUint8(
      headerOffset + HEAP_BLOCK_SIZE_BYTE_LENGTH,
      HEAP_STATUS_FREE,
    );
  }
}

// ============================================
// Инициализация данных для тестов
// ============================================

// Вспомогательная функция для создания заполненных буферов
const createBuffer = (size, fillValue) => {
  const ab = new ArrayBuffer(size);
  new Uint8Array(ab).fill(fillValue);
  return ab;
};

const arrayBuffer1 = createBuffer(16, 1); // 16 байт, заполненных единицами
const arrayBuffer2 = createBuffer(32, 2); // 32 байта, заполненных двойками
const arrayBuffer3 = createBuffer(16, 3); // 16 байт, заполненных тройками (размер совпадает с pointer1)
const arrayBuffer4 = createBuffer(128, 4); // 128 байт, заполненных четверками

const mem = new Memory(100 * 1024, { stack: 10 * 1024 });

console.log("--- ТЕСТ СТЕКА ---");

const pointer1 = mem.push(arrayBuffer1);
const pointer2_stack = mem.push(arrayBuffer2); // Сохраним ссылку для проверки

console.log("Deref pointer1 (ожидаем 1):", pointer1.deref());

pointer1.change(arrayBuffer3);
console.log("Deref pointer1 после change (ожидаем 3):", pointer1.deref());

mem.pop(); // удаляет arrayBuffer2
mem.pop(); // удаляет arrayBuffer3

// Проверяем защиту стека от чтения после pop
try {
  pointer1.deref();
  console.log("❌ Ошибка не выброшена: смогли прочитать pointer1 после pop");
} catch (error) {
  console.log("✅ Успешно перехвачена ошибка стека:", error.message);
}

// ============================================
//  Работа с кучей (динамическое управление)
// ============================================

console.log("\n--- ТЕСТ КУЧИ ---");

const pointer2 = mem.alloc(128);
pointer2.change(arrayBuffer4);
console.log("Deref pointer2 (ожидаем 4):", pointer2.deref());

const pointer3 = mem.alloc(8);
const pointer4 = mem.alloc(4);
const pointer5 = mem.alloc(5 * 1024);

// Проверяем защиту от неправильного размера данных
try {
  pointer3.change(arrayBuffer1); // Попытка записать 16 байт в блок размером 8 байт
  console.log("❌ Ошибка не выброшена: записали буфер неверного размера");
} catch (error) {
  console.log("✅ Успешно перехвачена ошибка размера:", error.message);
}

pointer2.free();
pointer3.free();
pointer4.free();
pointer5.free();

// Проверяем защиту от Double Free
try {
  pointer2.free();
  console.log("❌ Ошибка не выброшена: сработал повторный free()");
} catch (error) {
  console.log("✅ Успешно перехвачена ошибка Double Free:", error.message);
}

// Проверяем защиту от использования кучи после free
try {
  pointer2.deref();
  console.log("❌ Ошибка не выброшена: прочитали данные после free()");
} catch (error) {
  console.log("✅ Успешно перехвачена ошибка Use-After-Free:", error.message);
}
