const STACK_HEADER_BYTE_LENGTH = 4;

const HEAP_BLOCK_SIZE_BYTE_LENGTH = 4;
const HEAP_BLOCK_STATUS_BYTE_LENGTH = 1;
const HEAP_HEADER_BYTE_LENGTH =
  HEAP_BLOCK_SIZE_BYTE_LENGTH + HEAP_BLOCK_STATUS_BYTE_LENGTH;

const HEAP_STATUS_FREE = 0;
const HEAP_STATUS_BUSY = 1;

class Pointer {
  #dataOffset;
  #size;
  #memory;
  #memoryManager;
  #blockHeaderOffset;
  #validStatus = true;

  constructor(dataOffset, size, memory, blockHeaderOffset, memoryManager) {
    this.#dataOffset = dataOffset;
    this.#size = size;
    this.#memory = memory;
    this.#blockHeaderOffset = blockHeaderOffset;
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

  get dataOffset() {
    return this.#dataOffset;
  }

  get blockHeaderOffset() {
    return this.#blockHeaderOffset;
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

  [Symbol.dispose]() {
    if (this.#validStatus) {
      this.free();
    }
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
      0,
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

  #align(offset, alignment) {
    const remainder = offset % alignment;
    if (remainder === 0) return offset;
    return offset + (alignment - remainder);
  }

  alloc(length, DataType) {
    const requiredBytes = length * DataType.BYTES_PER_ELEMENT;
    const alignment = DataType.BYTES_PER_ELEMENT;
    let blockHeaderOffset = this.#heapStart;

    while (blockHeaderOffset < this.#buffer.byteLength) {
      const unalignedDataOffset = blockHeaderOffset + HEAP_HEADER_BYTE_LENGTH;
      const alignedDataOffset = this.#align(unalignedDataOffset, alignment);
      const padding = alignedDataOffset - unalignedDataOffset;

      const blockSize = this.#view.getUint32(blockHeaderOffset);
      const isBusy = this.#view.getUint8(
        blockHeaderOffset + HEAP_BLOCK_SIZE_BYTE_LENGTH,
      );

      if (isBusy === HEAP_STATUS_FREE && blockSize >= requiredBytes + padding) {
        const totalAllocatedSize = requiredBytes + padding;
        const remainingSpace = blockSize - totalAllocatedSize;

        if (remainingSpace <= HEAP_HEADER_BYTE_LENGTH) {
          this.#view.setUint32(blockHeaderOffset, blockSize);
          this.#view.setUint8(
            blockHeaderOffset + HEAP_BLOCK_SIZE_BYTE_LENGTH,
            HEAP_STATUS_BUSY,
          );
        } else {
          this.#view.setUint32(blockHeaderOffset, totalAllocatedSize);
          this.#view.setUint8(
            blockHeaderOffset + HEAP_BLOCK_SIZE_BYTE_LENGTH,
            HEAP_STATUS_BUSY,
          );

          const nextBlockOffset =
            blockHeaderOffset + HEAP_HEADER_BYTE_LENGTH + totalAllocatedSize;
          const nextBlockSize = remainingSpace - HEAP_HEADER_BYTE_LENGTH;

          this.#view.setUint32(nextBlockOffset, nextBlockSize);
          this.#view.setUint8(
            nextBlockOffset + HEAP_BLOCK_SIZE_BYTE_LENGTH,
            HEAP_STATUS_FREE,
          );
        }

        const bufferData = new Uint8Array(this.#buffer);

        return new Pointer(
          alignedDataOffset,
          requiredBytes,
          bufferData.subarray(
            alignedDataOffset,
            alignedDataOffset + requiredBytes,
          ),
          blockHeaderOffset,
          this,
        );
      } else {
        blockHeaderOffset += HEAP_HEADER_BYTE_LENGTH + blockSize;
      }
    }
    throw new Error("Out of memory: Heap is full or fragmented");
  }

  freePointer(pointer) {
    const currentBlockOffset = pointer.blockHeaderOffset;

    this.#view.setUint8(
      currentBlockOffset + HEAP_BLOCK_SIZE_BYTE_LENGTH,
      HEAP_STATUS_FREE,
    );

    let currentBlockSize = this.#view.getUint32(currentBlockOffset);

    while (true) {
      const nextBlockOffset =
        currentBlockOffset + HEAP_HEADER_BYTE_LENGTH + currentBlockSize;

      if (nextBlockOffset >= this.#buffer.byteLength) {
        break;
      }

      const nextBlockStatus = this.#view.getUint8(
        nextBlockOffset + HEAP_BLOCK_SIZE_BYTE_LENGTH,
      );

      if (nextBlockStatus === HEAP_STATUS_BUSY) {
        break;
      }

      const nextBlockSize = this.#view.getUint32(nextBlockOffset);

      currentBlockSize += HEAP_HEADER_BYTE_LENGTH + nextBlockSize;

      this.#view.setUint32(currentBlockOffset, currentBlockSize);

      console.log(
        `[Coalescing] Блоки склеены! Новый размер свободного блока: ${currentBlockSize} байт.`,
      );
    }
  }
}

// ============================================
// Проверка работы RAII
// ============================================

const mem = new Memory(100 * 1024, { stack: 10 * 1024 });
const arrayBuffer = new ArrayBuffer(128);
new Uint8Array(arrayBuffer).fill(42);

let p1, p2, p3, p4;

{
  console.log("--- Входим в блок выполнения ---");

  using pointer1 = mem.alloc(128, Uint8Array);
  pointer1.change(arrayBuffer);
  p1 = pointer1;

  using pointer2 = mem.alloc(2, Int32Array);
  p2 = pointer2;

  using pointer3 = mem.alloc(1, Int32Array);
  p3 = pointer3;

  using pointer4 = mem.alloc(640, Float64Array);
  p4 = pointer4;

  console.log("Указатели созданы. pointer1.isValid:", pointer1.isValid); // true
  console.log("--- Выходим из блока выполнения ---");
}

console.log("\n--- Проверка после выхода из области видимости ---");
console.log("pointer1.isValid:", p1.isValid); // false
console.log("pointer2.isValid:", p2.isValid); // false
console.log("pointer3.isValid:", p3.isValid); // false
console.log("pointer4.isValid:", p4.isValid); // false

try {
  p1.deref();
} catch (e) {
  console.log("Защита сработала:", e.message); // Pointer is invalid
}
