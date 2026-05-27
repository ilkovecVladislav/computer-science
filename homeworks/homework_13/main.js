const GOLDEN_RATIO = 2654435769;
const OBJECT_HASH_KEY = Symbol("object_hash_key");
const TOMBSTONE = Symbol("tombstone");

class HashMap {
  #data;
  #capacity;
  #size = 0;
  #globalObjectIdCounter = 0;

  constructor(capacity = 100) {
    this.#capacity = capacity;
    this.#data = new Array(capacity);
  }

  #getStringHash(value) {
    let hash = 5381;

    for (let i = 0; i < value.length; i++) {
      hash = (hash << 5) + hash + value.charCodeAt(i);
    }

    return (hash >>> 0) % this.#capacity;
  }

  #getFibonachiHash(value) {
    const hash = (value * GOLDEN_RATIO) >>> 0;
    return hash % this.#capacity;
  }

  #hash(key) {
    if (typeof key === "string") {
      return this.#getStringHash(key);
    }
    if (typeof key === "bigint") {
      return this.#getStringHash(key.toString());
    }
    if (typeof key === "number") {
      return this.#getFibonachiHash(key);
    }
    if (typeof key === "boolean") {
      return key ? this.#getFibonachiHash(1) : this.#getFibonachiHash(0);
    }
    if (key === null) {
      throw new TypeError("Unsupported key type");
    }
    if (typeof key === "object" || typeof key === "function") {
      if (key[OBJECT_HASH_KEY] !== undefined) {
        return this.#getFibonachiHash(key[OBJECT_HASH_KEY]);
      }
      this.#globalObjectIdCounter++;

      try {
        Object.defineProperty(key, OBJECT_HASH_KEY, {
          value: this.#globalObjectIdCounter,
          writable: false,
          enumerable: false,
          configurable: false,
        });
      } catch (e) {
        throw new TypeError("Frozen objects or proxies cannot be used as keys");
      }

      return this.#getFibonachiHash(this.#globalObjectIdCounter);
    }

    throw new TypeError("Unsupported key type");
  }

  #resize() {
    const oldData = this.#data;
    this.#capacity = this.#capacity * 2;
    this.#data = new Array(this.#capacity);
    this.#size = 0;

    oldData.forEach((item) => {
      if (item !== undefined && item !== TOMBSTONE) {
        this.set(item.key, item.value);
      }
    });
  }

  get(key) {
    let index = this.#hash(key);

    while (true) {
      const cell = this.#data[index];
      if (cell === undefined) {
        return undefined;
      }

      if (cell !== TOMBSTONE && cell.key === key) {
        return cell.value;
      }

      index = (index + 1) % this.#capacity;
    }
  }

  has(key) {
    let index = this.#hash(key);

    while (true) {
      const cell = this.#data[index];
      if (cell === undefined) {
        return false;
      }

      if (cell !== TOMBSTONE && cell.key === key) {
        return true;
      }

      index = (index + 1) % this.#capacity;
    }
  }

  set(key, value) {
    let index = this.#hash(key);
    let firstTombstoneIndex = -1;

    while (true) {
      const cell = this.#data[index];

      if (cell === TOMBSTONE) {
        if (firstTombstoneIndex === -1) {
          firstTombstoneIndex = index;
        }
      } else if (cell !== undefined) {
        if (cell.key === key) {
          cell.value = value;
          return;
        }
      } else {
        if (firstTombstoneIndex !== -1) {
          this.#data[firstTombstoneIndex] = { key, value };
        } else {
          this.#data[index] = { key, value };
        }

        this.#size++;

        if (this.#size / this.#capacity >= 0.6) {
          this.#resize();
        }

        return;
      }

      index = (index + 1) % this.#capacity;
    }
  }

  delete(key) {
    let index = this.#hash(key);

    while (true) {
      const cell = this.#data[index];
      if (cell === undefined) {
        return undefined;
      }

      if (cell !== TOMBSTONE && cell.key === key) {
        const deletedValue = cell.value;
        this.#data[index] = TOMBSTONE;
        this.#size--;
        return deletedValue;
      }

      index = (index + 1) % this.#capacity;
    }
  }
}

const map = new HashMap(5);

console.log("=== Тест 1: Запись примитивов и объектов ===");
const objKey1 = { name: "Alice" };
const objKey2 = { name: "Bob" };
const funcKey = () => {};

map.set("stringKey", "Строка");
map.set(42, "Число");
map.set(true, "Булево");
map.set(objKey1, "Объект 1");
map.set(objKey2, "Объект 2");
map.set(funcKey, "Функция");

console.log(map.get("stringKey")); // "Строка"
console.log(map.get(42)); // "Число"
console.log(map.get(true)); // "Булево"
console.log(map.get(objKey1)); // "Объект 1"
console.log(map.get(objKey2)); // "Объект 2"
console.log(map.get(funcKey)); // "Функция"

console.log(
  "\n=== Тест 2: Проверка дубликатов объектов с одинаковым содержанием ===",
);
const fakeObj = { name: "Alice" };
console.log(map.has(fakeObj)); // false

console.log("\n=== Тест 3: Обновление существующих значений ===");
map.set(42, "Новое Число");
console.log(map.get(42)); // "Новое Число"

console.log("\n=== Тест 4: Проверка существования (has) ===");
console.log(map.has("stringKey")); // true
console.log(map.has("unknown")); // false

console.log("\n=== Тест 5: Удаление (delete) ===");
console.log(map.delete(objKey1)); // "Объект 1"
console.log(map.has(objKey1)); // false
console.log(map.get(objKey1)); // undefined

console.log(
  "\n=== Тест 6: Оптимизация Tombstone (запись на место удаленного) ===",
);

map.set("newKey", "Я занял чье-то надгробие");
console.log(map.get("newKey"));

console.log("\n=== Тест 7: Проверка BigInt и ошибок ===");
const bigIntKey = 9007199254740991n;
map.set(bigIntKey, "Большое число");
console.log(map.get(bigIntKey));

try {
  map.set(null, "Упадет");
} catch (e) {
  console.log("Ошибка:", e.message); // "Unsupported key type"
}

console.log("\n=== Тест 7: Сравнение с нативным Map ===");

function runBenchmark(mapInstance, keys, operations) {
  const start = performance.now();

  // 1. Тестируем запись
  for (let i = 0; i < operations; i++) {
    mapInstance.set(keys[i], i);
  }

  // 2. Тестируем чтение
  for (let i = 0; i < operations; i++) {
    mapInstance.get(keys[i]);
  }

  const end = performance.now();
  console.log(`${operations} операций за ${(end - start).toFixed(2)}ms`);
}

const OPERATIONS = 5000;

const testKeys = Array.from({ length: OPERATIONS }, (_, i) => ({ id: i }));

const myMap = new HashMap(100);
const nativeMap = new Map();

console.log("Тестируем нашу HashMap:");
runBenchmark(myMap, testKeys, OPERATIONS);

console.log("Тестируем нативный Map:");
runBenchmark(nativeMap, testKeys, OPERATIONS);
