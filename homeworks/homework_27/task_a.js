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
