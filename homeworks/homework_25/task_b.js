function* task() {
  let count = 0;

  while (count < 10) {
    const start = performance.now();
    while (performance.now() - start < 25) {}

    console.log(`Шаг ${count}`, new Date().toISOString());
    count++;

    yield;
  }

  return "Завершено";
}

function runTask(generator, options) {
  const { threshold = 100, delay = 500 } = options;

  let workStartTime = performance.now();

  function handleNext() {
    const stepStart = performance.now();
    const result = generator.next();

    if (result.done) {
      return;
    }

    const stepDuration = performance.now() - stepStart;
    const totalElapsed = performance.now() - workStartTime;

    if (totalElapsed >= threshold || stepDuration >= threshold) {
      setTimeout(() => {
        workStartTime = performance.now();
        handleNext();
      }, delay);
    } else {
      handleNext();
    }
  }

  handleNext();
}

const gen = task();

runTask(gen, {
  threshold: 100, // 100 мс — порог для задержки
  delay: 500, // 500 мс — задержка, если порог превышен
});
