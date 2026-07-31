function querySelectorAllLazy(selector, root) {
  const treeWalker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_ELEMENT,
    {
      acceptNode(node) {
        if (node.matches(selector)) {
          return NodeFilter.FILTER_ACCEPT;
        }
        return NodeFilter.FILTER_SKIP;
      },
    },
    false,
  );

  return {
    [Symbol.iterator]() {
      return this;
    },

    next() {
      const node = treeWalker.nextNode();
      if (node) {
        return { value: node, done: false };
      }

      return { value: undefined, done: true };
    },
  };
}
