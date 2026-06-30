function iter(string) {
  const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });

  return {
    [Symbol.iterator]: function* () {
      for (const { segment } of segmenter.segment(string)) {
        yield segment;
      }
    },
  };
}
