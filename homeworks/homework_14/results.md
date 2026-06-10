## 📊 Результаты производительности: Нативный поиск vs Бинарный поиск

Тестирование проводилось на массиве из **5 000 000 элементов**, содержащем диапазон из 2 000 000 дубликатов значения `42`.

| Метод поиска                            | Нативный (`indexOf`) | Бинарный поиск | Ускорение |
| --------------------------------------- | -------------------- | -------------- | --------- |
| **Первое вхождение** (`indexOf`)        | ~0.9956 мс           | **~0.0483 мс** | **~20x**  |
| **Последнее вхождение** (`lastIndexOf`) | ~0.6707 мс           | **~0.0440 мс** | **~15x**  |

---

### 📝 Краткий вывод и сравнение

1. **Алгоритмическая сложность:**

- **Нативный метод** выполняет линейный поиск ($O(n)$). В худшем случае ему нужно проверить каждый элемент от начала (или конца) до целевого значения. На массиве из 5 млн элементов это ощутимо замедляет работу.
- **Бинарный поиск** работает за логарифмическое время ($O(\log n)$). Даже при 5 миллионах элементов ему требуется всего около 22-23 операций деления массива пополам, чтобы найти точное местоположение.

2. **Почему такая разница в тесте?**

- Нативный метод честно перебирает элементы один за другим.
- Бинарный поиск «прыгает» через миллионы элементов, мгновенно отсекая ненужные половины. Именно поэтому он показывает столь впечатляющие результаты на больших данных.

3. **Важное ограничение:**

- Бинарный поиск **требует предварительной сортировки**. Если данные не отсортированы, его использование невозможно (или требует затрат на сортировку, что нивелирует выигрыш в скорости).
- Нативный метод универсален — он работает с любыми массивами, но «платит» за это скоростью линейного перебора.

### Код

```
function indexOf(arr, target, selector) {
  let low = 0;
  let high = arr.length - 1;
  let result = -1;

  while (low <= high) {
    const mid = low + Math.floor((high - low) / 2);
    const guest = arr[mid];
    const value = selector ? selector(guest) : guest;

    if (value === target) {
      result = mid;
      high = mid - 1;
    } else if (value > target) {
      high = mid - 1;
    } else if (value < target) {
      low = mid + 1;
    }
  }

  return result;
}

function lastIndexOf(arr, target, selector) {
  let low = 0;
  let high = arr.length - 1;
  let result = -1;

  while (low <= high) {
    const mid = low + Math.floor((high - low) / 2);
    const guest = arr[mid];
    const value = selector ? selector(guest) : guest;

    if (value === target) {
      result = mid;
      low = mid + 1;
    } else if (value > target) {
      high = mid - 1;
    } else if (value < target) {
      low = mid + 1;
    }
  }

  return result;
}

// --- БЕНЧМАРК ---

console.log("Генерация массива...");
const BIG_ARRAY_SIZE = 5000000;
const bigArray = new Array(BIG_ARRAY_SIZE);

for (let i = 0; i < BIG_ARRAY_SIZE; i++) {
  if (i < 2000000) {
    bigArray[i] = 10;
  } else if (i < 4000000) {
    bigArray[i] = 42;
  } else {
    bigArray[i] = 99;
  }
}
console.log("Массив готов. Начинаем тесты.");

// 2. Тестируем indexOf
console.log("\n=== Тест indexOf ===");

const t0 = performance.now();
const nativeIndex = bigArray.indexOf(42);
const t1 = performance.now();
console.log(
  `Нативный indexOf: нашел индекс ${nativeIndex} за ${(t1 - t0).toFixed(4)}ms`,
);

const t2 = performance.now();
const customIndex = indexOf(bigArray, 42);
const t3 = performance.now();
console.log(
  `Бинарный indexOf: нашел индекс ${customIndex} за ${(t3 - t2).toFixed(4)}ms`,
);

// 3. Тестируем lastIndexOf
console.log("\n=== Тест lastIndexOf ===");

const t4 = performance.now();
const nativeLastIndex = bigArray.lastIndexOf(42);
const t5 = performance.now();
console.log(
  `Нативный lastIndexOf: нашел индекс ${nativeLastIndex} за ${(t5 - t4).toFixed(4)}ms`,
);

const t6 = performance.now();
const customLastIndex = lastIndexOf(bigArray, 42);
const t7 = performance.now();
console.log(
  `Бинарный lastIndexOf: нашел индекс ${customLastIndex} за ${(t7 - t6).toFixed(4)}ms`,
);


```
