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
