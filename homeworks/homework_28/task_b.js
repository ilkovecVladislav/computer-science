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
