## debounce

Необходимо написать функцию, которая принимает другую функцию и возвращает её debounce-версию.

```js
function debounce(cb, delay = 100) {
  let timer = null;

  return function (...args) {
    clearTimeout(timer);

    timer = setTimeout(() => {
      cb.apply(this, args);
    }, delay);
  };
}

function laugh() {
  console.log("Ha-ha!");
}

const debouncedLaugh = debounce(laugh, 300);

debouncedLaugh();
debouncedLaugh();
debouncedLaugh();
debouncedLaugh();
debouncedLaugh();
```

---

## throttle

Необходимо написать функцию, которая принимает другую функцию и возвращает её throttle-версию.

```js
function throttle(cb, interval) {
  let time = Date.now();

  return function (...args) {
    const now = Date.now();
    if (now - time < interval) {
      return;
    }
    time = now;
    cb.apply(this, args);
  };
}

function laugh() {
  console.log("Ha-ha!");
}

const throttledLaugh = throttle(laugh, 300);

throttledLaugh(); // Выполнится сразу
throttledLaugh();
throttledLaugh();
throttledLaugh();
throttledLaugh();
```

---

## waterfall для callback-функций

Необходимо создать функцию для композиции асинхронного кода на callback-функциях, которая работает как показано на примере.

```js
function waterfall(tasks, finalCallback) {
  const data = tasks instanceof Set ? [...tasks] : tasks;
  let currentIndex = 0;

  function next(err, ...results) {
    if (err) {
      finalCallback(err);
      return;
    }

    if (currentIndex === data.length) {
      finalCallback(null, ...results);
      return;
    }

    const task = data[currentIndex];
    currentIndex++;

    task(...results, next);
  }

  const firstTask = data[0];
  currentIndex = 1;
  firstTask(next);
}

waterfall(
  [
    (cb) => {
      // Первый аргумент cb — это ошибка.
      // Если она не null, выполнение сразу должно переводиться на финальный callback.
      cb(null, "one", "two");
    },

    (arg1, arg2, cb) => {
      console.log(arg1); // one
      console.log(arg2); // two
      cb(null, "three");
    },

    (arg1, cb) => {
      console.log(arg1); // three
      cb(null, "done");
    },
  ],
  (err, result) => {
    console.log(result); // done
  },
);

waterfall(
  new Set([
    (cb) => {
      cb("ha-ha!");
    },

    (arg1, cb) => {
      cb(null, "done");
    },
  ]),
  (err, result) => {
    console.log(err); // ha-ha!
    console.log(result); // undefined
  },
);
```
