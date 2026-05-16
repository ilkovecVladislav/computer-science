## Сравнение кастомного класса `Vector<RGBA>` и стандартного `Array<RGBAObj>`

### 1. Сравнение производительности (Последовательный доступ)

| Объём данных | Победитель | Vector (ms) | Array (ms) | Разница (в пользу лидера) |
| ------------ | ---------- | ----------- | ---------- | ------------------------- |
| **1 000**    | Array      | 0.56 ms     | 0.09 ms    | Array +83.6%              |
| **10 000**   | Array      | 2.13 ms     | 0.64 ms    | Array +69.9%              |
| **50 000**   | Array      | 7.68 ms     | 2.76 ms    | Array +64.1%              |
| **100 000**  | **Vector** | 6.19 ms     | 9.59 ms    | **Vector +54.9%**         |

**Вывод:** На малых и средних объемах данных (до 50 000 элементов) стандартный `Array` работает быстрее. Это связано с тем, что кастомный `Vector` имеет накладные расходы (overhead) на вызовы методов `DataView` и валидацию индексов. Однако на больших объемах данных (**100 000+**) `Vector` полностью раскрывает свои преимущества линейной непрерывной памяти и обгоняет `Array` на **54.9%**, так как процессор начинает эффективнее использовать кэш.

---

### 2. Влияние сборщика мусора (GC) на дистанции в 500 итераций

| Условие тестирования                     | Vector (ms) | Array (ms) | Победитель и Разница        |
| ---------------------------------------- | ----------- | ---------- | --------------------------- |
| **Без принудительного GC**               | 866.92 ms   | 301.56 ms  | Array быстрее на 65.2%      |
| **С принудительным GC (раз в 10 итер.)** | 914.17 ms   | 1326.20 ms | **Vector быстрее на 45.1%** |

**Вывод:** В сценарии без контроля памяти `Array` выигрывает за счет агрессивного выделения объектов движком V8. Но картина кардинально меняется при включении реальной нагрузки на сборщик мусора (GC):

- Время работы стандартного `Array` возрастает **более чем в 4 раза** (с 300 до 1326 мс) из-за необходимости постоянно очищать миллионы созданных и уничтоженных объектов `RGBA`.
- Наш `Vector` продемонстрировал железную стабильность — время выполнения увеличилось всего на ~5% (с 866 до 914 мс). В условиях активного GC вектор оказывается **на 45.1% быстрее** массива, полностью исключая просадки производительности (фризы).

---

### 3. Эффективность использования памяти (100k элементов)

| Структура данных         | Потребление памяти (MB) | Экономия памяти |
| ------------------------ | ----------------------- | --------------- |
| **Array (native JS)**    | 28.57 MB                | —               |
| **Vector (наш вариант)** | **5.32 MB**             | **81.4%**       |

---

### 4. Сильные и слабые стороны разработанной структуры

**Кастомный `Vector`:**

- ✅ **Колоссальная экономия памяти (более 80%):** Данные упакованы максимально плотно.
- ✅ **Иммунитет к GC-паузам:** Программа работает с предсказуемой скоростью, не заставляя сборщик мусора тратить ресурсы.
- ✅ **Эффективность на High-Load:** На объемах свыше 100k элементов обгоняет нативный массив по чистой скорости.
- ❌ **Накладные расходы на микро-данных:** Из-за ручного пересчета оффсетов медленнее массивов на объемах < 10k элементов.

**Стандартный `Array`:**

- ✅ **Высокая скорость «из коробки»:** Быстрая инициализация и работа на небольших массивах.
- ✅ **Простота синтаксиса:** Отсутствие необходимости думать о байтах и выделении памяти.
- ❌ **Огромный расход памяти:** Тратит почти в 5 раз больше памяти на хранение аналогичного объема данных.
- ❌ **GC-зависимость:** Непригоден для систем реального времени (игры, симуляции, обработка звука/видео), так как вызывает микро-фризы при очистке памяти.

---

### 5. Итоговые рекомендации по применению

1. **Использовать разработанный `Vector` имеет смысл, если:**

- Вы пишете долгоживущее приложение (сервер, игровой движок, real-time графику в браузере), где критически важна стабильная частота кадров без задержек.
- Количество обрабатываемых объектов превышает 50k–100k штук.
- Приложение ограничено по памяти (например, мобильные устройства или микросервисы).

2. **Оставаться на стандартном `Array` лучше, если:**

- Производится работа с небольшими коллекциями (до 10 000 элементов).
- Пишется одноразовый скрипт, где память утилизируется сразу после завершения работы процесса.

---

### 6. Код

```
function hexToRGB(hex) {
  let hexLongValueFormat;
  if (hex.length === 4) {
    hexLongValueFormat =
      "#" +
      hex
        .slice(1)
        .split("")
        .map((color) => `${color}${color}`)
        .join("");
  } else {
    hexLongValueFormat = hex.startsWith("#") ? hex : `#${hex}`;
  }

  const r = parseInt(hexLongValueFormat.slice(1, 3), 16);
  const g = parseInt(hexLongValueFormat.slice(3, 5), 16);
  const b = parseInt(hexLongValueFormat.slice(5, 7), 16);

  return [r, g, b, 255];
}

export class RGBA {
  static BYTES_PER_ELEMENT = 4;
  #offset;
  #view;

  constructor(view, offset = 0) {
    this.#offset = offset;
    this.#view = view;
  }

  static setElement(view, offset, value) {
    let encodedValue;
    if (Array.isArray(value)) {
      encodedValue = value;
    } else if (typeof value === "string") {
      encodedValue = hexToRGB(value);
    } else {
      return;
    }

    for (let i = 0; i < RGBA.BYTES_PER_ELEMENT; i++) {
      view.setUint8(offset + i, encodedValue[i]);
    }
  }

  static getElement(view, offset) {
    let result = [];
    for (let i = 0; i < RGBA.BYTES_PER_ELEMENT; i++) {
      result.push(view.getUint8(offset + i));
    }
    return result;
  }

  get red() {
    return this.#view.getUint8(this.#offset);
  }
  get green() {
    return this.#view.getUint8(this.#offset + 1);
  }
  get blue() {
    return this.#view.getUint8(this.#offset + 2);
  }
  get alpha() {
    return this.#view.getUint8(this.#offset + 3);
  }

  set red(value) {
    this.#view.setUint8(this.#offset, value);
  }
  set green(value) {
    this.#view.setUint8(this.#offset + 1, value);
  }
  set blue(value) {
    this.#view.setUint8(this.#offset + 2, value);
  }
  set alpha(value) {
    this.#view.setUint8(this.#offset + 3, value);
  }
}

export class Vector {
  #buffer;
  #dataView;
  #elementViewModel;

  constructor(capacityOrOptions, view) {
    let capacity = 1024;

    if (typeof capacityOrOptions === "number") {
      capacity = capacityOrOptions;
    } else if (capacityOrOptions && typeof capacityOrOptions === "object") {
      capacity = capacityOrOptions.capacity || capacity;
    }

    const bufferSize = 8 + capacity * view.BYTES_PER_ELEMENT;
    this.#buffer = new ArrayBuffer(bufferSize);
    this.#dataView = new DataView(this.#buffer);
    this.#elementViewModel = view;

    this.#dataView.setUint32(0, capacity);
    this.#dataView.setUint32(4, 0);
  }

  get capacity() {
    return this.#dataView.getUint32(0);
  }

  get length() {
    return this.#dataView.getUint32(4);
  }

  #getOffset(index) {
    return 8 + index * this.#elementViewModel.BYTES_PER_ELEMENT;
  }

  #reallocate(capacity) {
    let newCapacity = capacity !== undefined ? capacity : this.capacity * 2;
    if (newCapacity === 0) newCapacity = 1;

    const newBufferSize =
      8 + newCapacity * this.#elementViewModel.BYTES_PER_ELEMENT;
    const newBuffer = new ArrayBuffer(newBufferSize);

    const srcBytes = new Uint8Array(this.#buffer);
    const newBufferBytes = new Uint8Array(newBuffer);

    const bytesToCopy = Math.min(
      srcBytes.byteLength,
      newBufferBytes.byteLength,
    );

    newBufferBytes.set(srcBytes.subarray(0, bytesToCopy));

    this.#buffer = newBuffer;
    this.#dataView = new DataView(this.#buffer);
    this.#dataView.setUint32(0, newCapacity);
  }

  get(index) {
    if (index >= 0 && index < this.length) {
      const offset = this.#getOffset(index);
      return this.#elementViewModel.getElement(this.#dataView, offset);
    }

    throw new RangeError("Index out of bounds");
  }

  set(index, value) {
    if (index < 0 || index >= this.capacity) {
      throw new RangeError("Index out of bounds");
    }

    const offset = this.#getOffset(index);
    this.#elementViewModel.setElement(this.#dataView, offset, value);

    if (index >= this.length) {
      this.#dataView.setUint32(4, index + 1);
    }
  }

  fill(value) {
    for (
      let i = 8;
      i < this.#buffer.byteLength;
      i += this.#elementViewModel.BYTES_PER_ELEMENT
    ) {
      this.#elementViewModel.setElement(this.#dataView, i, value);
    }
  }

  pop() {
    const index = this.length - 1;
    const lastElement = this.get(index);

    this.#dataView.setUint32(4, index);
    return lastElement;
  }

  push(value) {
    if (this.length === this.capacity) {
      this.#reallocate();
    }

    this.set(this.length, value);
  }

  shrinkToFit() {
    if (this.length === this.capacity) {
      return;
    }

    const newCapacity = this.length;
    this.#reallocate(newCapacity);
  }

  reserve(extraCapacity) {
    if (this.length + extraCapacity > this.capacity) {
      this.#reallocate(this.length + extraCapacity);
    }
  }

  view(index) {
    if (index < 0 || index >= this.length) {
      throw new RangeError("Index out of bounds");
    }

    const offset = this.#getOffset(index);

    return new this.#elementViewModel(this.#dataView, offset);
  }

  shift() {
    const firstElement = this.get(0);
    if (this.length <= 1) {
      this.#dataView.setUint32(4, 0);
    } else {
      const bytes = new Uint8Array(this.#buffer);
      const startDst = 8;
      const startSrc = 8 + this.#elementViewModel.BYTES_PER_ELEMENT;
      const endSrc = 8 + this.length * this.#elementViewModel.BYTES_PER_ELEMENT;

      bytes.copyWithin(startDst, startSrc, endSrc);
      this.#dataView.setUint32(4, this.length - 1);
    }

    return firstElement;
  }

  unshift(value) {
    if (this.length === this.capacity) {
      this.#reallocate();
    }

    const bytes = new Uint8Array(this.#buffer);
    const startDst = 8 + this.#elementViewModel.BYTES_PER_ELEMENT;
    const startSrc = 8;
    const endSrc = 8 + this.length * this.#elementViewModel.BYTES_PER_ELEMENT;

    bytes.copyWithin(startDst, startSrc, endSrc);
    this.set(0, value);
    this.#dataView.setUint32(4, this.length + 1);
  }
}

```
