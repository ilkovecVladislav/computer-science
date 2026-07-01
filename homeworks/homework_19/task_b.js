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
