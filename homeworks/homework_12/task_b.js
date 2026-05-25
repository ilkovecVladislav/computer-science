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

class Rc {
  #pointer;
  #state;
  #isDisposed = false;

  constructor(pointer, sharedState = null) {
    if (!(pointer instanceof Pointer)) {
      throw new Error("Rc can only wrap a valid Pointer instance");
    }
    this.#pointer = pointer;
    this.#state = sharedState ?? { count: 1 };
  }

  get count() {
    return this.#state.count;
  }

  change(buffer) {
    if (this.#isDisposed) throw new Error("Rc pointer is disposed");
    this.#pointer.change(buffer);
  }

  deref() {
    if (this.#isDisposed) throw new Error("Rc pointer is disposed");
    return this.#pointer.deref();
  }

  clone() {
    if (this.#isDisposed) throw new Error("Cannot clone a disposed pointer");

    this.#state.count++;

    return new Rc(this.#pointer, this.#state);
  }

  [Symbol.dispose]() {
    if (this.#isDisposed) return;

    this.#isDisposed = true;
    this.#state.count--;

    console.log(`[Rc] Ссылка удалена. Осталось ссылок: ${this.#state.count}`);

    if (this.#state.count === 0) {
      console.log("[Rc] Счётчик достиг нуля. Освобождаем физическую память...");
      this.#pointer.free();
    }
  }
}

// ============================================
// Проверка работы RAII и Счетчик Ссылок (Rc)
// ============================================

const memoryManager = new Memory(100 * 1024, { stack: 10 * 1024 });
const buffer = new ArrayBuffer(128);
new Uint8Array(buffer).fill(99);

let rawPointerRef;

{
  console.log("--- Выделяем память и оборачиваем в Rc ---");
  const rawPointer = memoryManager.alloc(128, Uint8Array);
  rawPointerRef = rawPointer;

  using pointer1 = new Rc(rawPointer);
  pointer1.change(buffer);
  console.log(`Создан pointer1. Количество ссылок: ${pointer1.count}`); // 1

  {
    console.log("\n--- Клонируем указатель во вложенном блоке ---");
    using pointer2 = pointer1.clone();
    console.log(`Создан pointer2 (клон). Количество ссылок: ${pointer1.count}`); // 2
    console.log("Данные из pointer2:", pointer2.deref()[0]); // 99
    console.log("Выходим из вложенного блока...");
  }

  console.log(
    `\nВернулись в основной блок. Количество ссылок: ${pointer1.count}`,
  ); // 1
  console.log("Физический поинтер все еще валиден?:", rawPointerRef.isValid); // true
  console.log("Данные из pointer1:", pointer1.deref()[0]); // 99
  console.log("Выходим из основного блока...");
}

console.log("\n--- Проверка после всех блоков ---");
console.log("Физический поинтер освобожден?:", !rawPointerRef.isValid); // true

try {
  rawPointerRef.deref();
} catch (e) {
  console.log("Защита менеджера памяти сработала:", e.message); // Pointer is invalid
}
