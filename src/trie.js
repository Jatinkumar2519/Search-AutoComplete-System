export class TrieNode {
  constructor() {
    this.children = new Map();
    this.isWord = false;
    this.freq = 0;
    // cached top suggestions: array of {word, freq}
    this.top = [];
  }
}

export default class Trie {
  constructor(topK = 10) {
    this.root = new TrieNode();
    this.topK = topK;
  }

  // insert or update frequency for a word
  insert(word, freq = 1) {
    const nodes = [];
    let node = this.root;
    nodes.push(node);
    for (const ch of word) {
      if (!node.children.has(ch)) node.children.set(ch, new TrieNode());
      node = node.children.get(ch);
      nodes.push(node);
    }
    node.isWord = true;
    node.freq = (node.freq || 0) + freq;

    // Update top arrays along the path
    for (const n of nodes) {
      this._upsertTop(n, word, node.freq);
    }
  }

  _upsertTop(node, word, freq) {
    // find if word exists
    const idx = node.top.findIndex((x) => x.word === word);
    if (idx >= 0) {
      node.top[idx].freq = freq;
    } else {
      node.top.push({ word, freq });
    }
    // sort descending by freq then lexicographically
    node.top.sort((a, b) => b.freq - a.freq || a.word.localeCompare(b.word));
    if (node.top.length > this.topK) node.top.length = this.topK;
  }

  // return top-k suggestions for prefix (fast using cached lists)
  getTopK(prefix) {
    let node = this.root;
    for (const ch of prefix) {
      if (!node.children.has(ch)) return [];
      node = node.children.get(ch);
    }
    return node.top.map((x) => x.word);
  }

  // simple exact prefix search boolean (exists)
  startsWith(prefix) {
    let node = this.root;
    for (const ch of prefix) {
      if (!node.children.has(ch)) return false;
      node = node.children.get(ch);
    }
    return true;
  }

  // For a fuzzy fallback: return candidates that include substring (linear scan)
  // Note: this is O(N) across dictionary — OK for small demos
  fuzzyIncludes(substr) {
    const results = new Set();
    this._dfsCollect(this.root, '', results);
    return Array.from(results).filter((w) => w.includes(substr)).slice(0, this.topK);
  }

  _dfsCollect(node, path, results) {
    if (node.isWord) results.add(path);
    for (const [ch, child] of node.children) {
      this._dfsCollect(child, path + ch, results);
    }
  }
}