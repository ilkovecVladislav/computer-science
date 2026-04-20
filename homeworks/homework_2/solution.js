const instructions = {
  "SET A": 0,
  "PRINT A": 1,
  "IFN A": 2,
  RET: 3,
  "DEC A": 4,
  JMP: 5,
};

const program = [
  // Ставим значения аккумулятора
  instructions["SET A"],
  // В 10
  10,

  // Выводим значение на экран
  instructions["PRINT A"],

  // Если A равно 0
  instructions["IFN A"],

  // Программа завершается
  instructions["RET"],

  // И возвращает 0
  0,

  // Уменьшаем A на 1
  instructions["DEC A"],

  // Устанавливаем курсор выполняемой инструкции
  instructions["JMP"],

  // В значение 2
  2,
];

function execute(program) {
  let acc = 0;
  let cursor = 0;

  let currInstruction = program[cursor];
  let skipNextInstruction = false;

  /**
   * Возвращает true, если исполняемая инструкция может быть выполнена.
   * Почему это важно: если инструкция IFN A даст ложный результат,
   * то придется пропустить следующую за ней инструкцию.
   * Проблема в том, что мы не знаем сколько "байт" нужно пропустить,
   * поэтому мы просто ставим флаг skipNextInstruction и продолжаем идти по байткоду,
   * но с учетом того, что следующее вычисление нужно пропустить.
   * @returns {boolean}
   */
  function canExecute() {
    const result = !skipNextInstruction;
    skipNextInstruction = false;
    return result;
  }

  while (currInstruction != null) {
    switch (currInstruction) {
      case instructions["SET A"]:
        cursor++;

        if (canExecute()) {
          acc = program[cursor];
        }

        break;

      case instructions["PRINT A"]:
        if (canExecute()) {
          console.log(acc);
        }

        break;

      case instructions["IFN A"]:
        if (canExecute()) {
          if (acc !== 0) {
            skipNextInstruction = true;
          }

          // Вложенный if внутри пропускаемого if
        } else {
          skipNextInstruction = true;
        }

        break;

      case instructions["RET"]:
        cursor++;

        if (canExecute()) {
          return program[cursor];
        }

        break;

      case instructions["DEC A"]:
        if (canExecute()) {
          acc--;
        }

        break;

      case instructions["JMP"]:
        cursor++;

        if (canExecute()) {
          cursor = program[cursor] - 1;
        }

        break;
    }

    currInstruction = program[++cursor];
  }
}

console.log("program:", program);

execute(program);
