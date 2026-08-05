function* getNumbers(inputString) {
  let currentString = inputString;

  while (true) {
    const decimals = currentString.matchAll(/[+-]?\d*\.\d+/g);

    for (let value of decimals) {
      yield value[0];
    }

    currentString = yield new Error("Need new data");
  }
}

function testGenerator() {
  const inputs = [
    "abc 1.23 def 4.56",
    "no numbers here",
    "7.89 and -0.12",
    "",
    "100.001 end",
  ];

  const gen = getNumbers(inputs[0]);

  let step = 0;
  let inputIndex = 0;

  let result = gen.next();

  while (step < 10 && !result.done) {
    if (result.value instanceof Error) {
      console.log(`STEP ${step}: Need new data`);

      inputIndex++;

      if (inputIndex >= inputs.length) {
        console.log("➡️ Нет больше входных данных");
        break;
      }

      console.log("➡️ Передаём новую строку:", inputs[inputIndex]);
      result = gen.next(inputs[inputIndex]);
    } else {
      console.log(`STEP ${step}:`, result.value);
      result = gen.next();
    }

    step++;
  }
}

const numbers = getNumbers("start 0.5 and 2.3");
testGenerator();
