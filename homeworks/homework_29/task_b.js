class Mutex {
  #resource;
  #queue;
  #isLocked;

  constructor(data) {
    this.#resource = data;
    this.#queue = [];
    this.#isLocked = false;
  }

  read = () => {
    return new Promise((resolve) => {
      if (!this.#isLocked) {
        this.#isLocked = true;
        resolve({
          value: this.#resource,
          free: this.#createReleaseFunction(),
        });
      } else {
        this.#queue.push({ resolve });
      }
    });
  };

  free = () => {
    if (this.#queue.length > 0) {
      const item = this.#queue.shift();
      item.resolve({
        value: this.#resource,
        free: this.#createReleaseFunction(),
      });
    } else {
      this.#isLocked = false;
    }
  };

  withLock = async (fn) => {
    const { value, free } = await this.read();
    try {
      return await fn(value);
    } finally {
      free();
    }
  };

  #createReleaseFunction() {
    let isReleased = false;
    return () => {
      if (isReleased) return;
      isReleased = true;
      this.free();
    };
  }
}

class Semaphore {
  #resource;
  #limit;
  #activeCount;
  #queue;

  constructor(data, limit = 1) {
    this.#resource = data;
    this.#limit = limit;
    this.#activeCount = 0;
    this.#queue = [];
  }

  read = () => {
    return new Promise((resolve) => {
      if (this.#activeCount < this.#limit) {
        this.#activeCount++;
        resolve({
          value: this.#resource,
          free: this.#createReleaseFunction(),
        });
      } else {
        this.#queue.push({ resolve });
      }
    });
  };

  free = () => {
    if (this.#queue.length > 0) {
      const item = this.#queue.shift();
      item.resolve({
        value: this.#resource,
        free: this.#createReleaseFunction(),
      });
    } else {
      this.#activeCount--;
    }
  };

  withLock = async (fn) => {
    const { value, free } = await this.read();
    try {
      return await fn(value);
    } finally {
      free();
    }
  };

  #createReleaseFunction() {
    let isReleased = false;
    return () => {
      if (isReleased) return;
      isReleased = true;
      this.free();
    };
  }
}
