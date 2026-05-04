function cyclicLeftShift(number, k) {
  const n = k % 32;
  if (k % 32 === 0) {
    return number >>> 0;
  }
  const shift = number >>> (32 - n);

  return (number << n) | shift;
}

function cyclicRightShift(number, k) {
  const n = k % 32;
  if (k % 32 === 0) {
    return number >>> 0;
  }

  const shift = number << (32 - n);

  return (number >>> n) | shift;
}

console.log(
  "cyclicLeftShift",
  cyclicLeftShift(0b10000000_00000000_00000000_00000001, 1) ===
    0b00000000_00000000_00000000_00000011,
);

console.log(
  "cyclicRightShift",
  cyclicRightShift(0b10000000_00000000_00000000_00000001, 2) ===
    0b01100000_00000000_00000000_00000000,
);
