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
