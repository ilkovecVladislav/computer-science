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
