## Класс для построения бора

```
class Trie {
  data;
  activeNode = 0;

  constructor() {
    this.data = [{ children: new Map(), isEnd: false }];
  }

  addWord(value) {
    let currentIndex = 0;

    for (const char of value) {
      const childrenMap = this.data[currentIndex].children;

      if (childrenMap.has(char)) {
        currentIndex = childrenMap.get(char);
      } else {
        this.data.push({ children: new Map(), isEnd: false });

        const newIndex = this.data.length - 1;

        childrenMap.set(char, newIndex);

        currentIndex = newIndex;
      }
    }

    this.data[currentIndex].isEnd = true;
  }

  go(char) {
    if (this.activeNode === -1) {
      return this;
    }

    const children = this.data[this.activeNode].children;

    if (children.has(char)) {
      this.activeNode = children.get(char);
    } else {
      this.activeNode = -1;
    }

    return this;
  }

  isWord() {
    return this.activeNode !== -1 && this.data[this.activeNode].isEnd;
  }

  reset() {
    this.activeNode = 0;
    return this;
  }
}

```

---

## Функция для определения множества строк по шаблону

```
function match(pattern, strings) {
  const result = [];
  const patternParts = pattern.split(".");

  for (const str of strings) {
    const strParts = str.split(".");

    if (isMatch(patternParts, strParts)) {
      result.push(str);
    }
  }
  return result;
}

function isMatch(patternParts, strParts) {
  const isWildcardEnd = patternParts[patternParts.length - 1] === "**";

  if (!isWildcardEnd && patternParts.length !== strParts.length) {
    return false;
  }

  if (isWildcardEnd && strParts.length < patternParts.length - 1) {
    return false;
  }

  for (let i = 0; i < patternParts.length; i++) {
    const p = patternParts[i];

    if (p === "**") return true;

    if (p === "*") continue;

    if (p !== strParts[i]) return false;
  }

  return true;
}

```
