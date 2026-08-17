## Контейнер Result

Необходимо написать контейнер Result с двумя состояниями: Ok и Err.

```js
class Result {
  isRejected = false;
  result;

  constructor(cb) {
    try {
      this.result = cb();
    } catch (err) {
      this.isRejected = true;
      this.result = err;
    }
  }

  then(cb) {
    if (!this.isRejected) {
      try {
        this.result = cb(this.result);
      } catch (err) {
        this.isRejected = true;
        this.result = err;
      }
    }
    return this;
  }

  catch(cb) {
    if (this.isRejected) {
      cb(this.result);
      this.isRejected = false;
    }
    return this;
  }
}

const res1 = new Result(() => 42);

res1.then((data) => {
  console.log(data); // 42
});

const res2 = new Result(() => {
  throw "Boom!";
});

res2
  .then((data) => {
    // Этот callback не вызовется
    console.log(data);
  })
  .catch((err) => {
    console.error(err); // Boom!
  });
```

---

## async/await для Result

Необходимо, используя генераторы, создать аналог async/await для контейнера Result.

```js
function exec(fn) {
  const iterator = fn();

  function next(prevValue) {
    const { value, done } = iterator.next(prevValue);

    if (done) {
      return value;
    }

    value
      .then((result) => {
        next(result);
      })
      .catch((error) => {
        try {
          iterator.throw(error);
        } catch (err) {
          console.error("Uncaught error in generator:", err);
        }
      });
  }

  next();
}

exec(function* main() {
  const res1 = new Result(() => 42);
  console.log(yield res1); // 42

  try {
    const res2 = yield new Result(() => {
      throw "Boom!";
    });
  } catch (err) {
    console.error(err); // Boom!
  }
});
```
