import { Deque, DequeRealoc } from "./main.js";

function runBenchmark() {
  console.log("============================================================");
  console.log("БЕНЧМАРК: Deque (Связный список) vs DequeRealoc (Реаллокация)");
  console.log("============================================================\n");

  const ITERATIONS = 200000;
  const BLOCK_SIZE = 64;

  // ==========================================
  // ТЕСТ 1: Последовательные push и pop
  // ==========================================
  console.log(
    `📊 Тест 1: ${ITERATIONS} операций push, затем ${ITERATIONS} операций pop...`,
  );

  const listDeque = new Deque(Uint32Array, BLOCK_SIZE);
  let start = performance.now();
  for (let i = 0; i < ITERATIONS; i++) listDeque.push(i);
  for (let i = 0; i < ITERATIONS; i++) listDeque.pop();
  const timeListPushPop = performance.now() - start;

  const allocDeque = new DequeRealoc(Uint32Array, BLOCK_SIZE);
  start = performance.now();
  for (let i = 0; i < ITERATIONS; i++) allocDeque.push(i);
  for (let i = 0; i < ITERATIONS; i++) allocDeque.pop();
  const timeAllocPushPop = performance.now() - start;

  console.log(`  - Deque (Связный список):  ${timeListPushPop.toFixed(2)} ms`);
  console.log(
    `  - DequeRealoc (Реаллокация): ${timeAllocPushPop.toFixed(2)} ms`,
  );
  console.log(
    `  Результат: ${timeListPushPop < timeAllocPushPop ? "Связный список быстрее" : "Реаллокация быстрее"}\n`,
  );

  // ==========================================
  // ТЕСТ 2: unshift и shift
  // ==========================================
  console.log(
    `📊 Тест 2: ${ITERATIONS} операций unshift, затем ${ITERATIONS} операций shift...`,
  );

  const listDeque2 = new Deque(Uint32Array, BLOCK_SIZE);
  start = performance.now();
  for (let i = 0; i < ITERATIONS; i++) listDeque2.unshift(i);
  for (let i = 0; i < ITERATIONS; i++) listDeque2.shift();
  const timeListUnshiftShift = performance.now() - start;

  const allocDeque2 = new DequeRealoc(Uint32Array, BLOCK_SIZE);
  start = performance.now();
  for (let i = 0; i < ITERATIONS; i++) allocDeque2.unshift(i);
  for (let i = 0; i < ITERATIONS; i++) allocDeque2.shift();
  const timeAllocUnshiftShift = performance.now() - start;

  console.log(
    `  - Deque (Связный список):  ${timeListUnshiftShift.toFixed(2)} ms`,
  );
  console.log(
    `  - DequeRealoc (Реаллокация): ${timeAllocUnshiftShift.toFixed(2)} ms`,
  );
  console.log(
    `  Результат: ${timeListUnshiftShift < timeAllocUnshiftShift ? "Связный список быстрее" : "Реаллокация быстрее"}\n`,
  );

  // ==========================================
  // ТЕСТ 3: Стресс-тест (Смешанные операции)
  // ==========================================
  console.log(`💥 Тест 3: Смешанная нагрузка (чередование сторон)...`);

  const listDeque3 = new Deque(Uint32Array, BLOCK_SIZE);
  start = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    if (i % 2 === 0) listDeque3.push(i);
    else listDeque3.unshift(i);
  }
  for (let i = 0; i < ITERATIONS; i++) {
    if (i % 4 === 0) listDeque3.pop();
    else listDeque3.shift();
  }
  const timeListStress = performance.now() - start;

  const allocDeque3 = new DequeRealoc(Uint32Array, BLOCK_SIZE);
  start = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    if (i % 2 === 0) allocDeque3.push(i);
    else allocDeque3.unshift(i);
  }
  for (let i = 0; i < ITERATIONS; i++) {
    if (i % 4 === 0) allocDeque3.pop();
    else allocDeque3.shift();
  }
  const timeAllocStress = performance.now() - start;

  console.log(`  - Deque (Связный список):  ${timeListStress.toFixed(2)} ms`);
  console.log(
    `  - DequeRealoc (Реаллокация): ${timeAllocStress.toFixed(2)} ms`,
  );
  console.log(
    `  Результат: ${timeListStress < timeAllocStress ? "Связный список быстрее" : "Реаллокация быстрее"}\n`,
  );

  console.log("============================================================");
}

runBenchmark();
