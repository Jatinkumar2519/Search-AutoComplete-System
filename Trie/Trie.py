import json
from pathlib import Path


class TrieNode:
    def __init__(self):
        self.indices = []
        self.children = {}
        self.is_end = False


class Trie:
    def __init__(self):
        self.words = []
        self.root = TrieNode()
        self.data_file = Path(__file__).resolve().parent / "data.json"
        self._load_data()

    def _load_data(self):
        if self.data_file.exists():
            try:
                data = json.loads(self.data_file.read_text(encoding="utf-8"))
                if isinstance(data, list):
                    # normalize to lowercase for case-insensitive search
                    self.words = [str(w).lower() for w in data]
                else:
                    self.words = []
            except Exception:
                self.words = []
        else:
            self.words = []

        # Build trie from existing words
        for idx, word in enumerate(self.words):
            self.insert(word, idx)

    def _save_data(self):
        try:
            self.data_file.write_text(json.dumps(self.words, ensure_ascii=False, indent=2), encoding="utf-8")
        except Exception:
            pass

    def insert(self, word: str, idx: int):
        node = self.root
        for ch in word:
            if ch not in node.children:
                node.children[ch] = TrieNode()
            node = node.children[ch]
            # avoid duplicate indices
            if not node.indices or node.indices[-1] != idx:
                node.indices.append(idx)
        node.is_end = True

    def autocomplete(self, prefix: str):
        node = self.root
        prefix = str(prefix).strip().lower()

        for ch in prefix:
            if ch not in node.children:
                return []
            node = node.children[ch]

        # remove duplicate indices while preserving order
        seen = set()
        indices = []
        for i in node.indices:
            if i not in seen:
                seen.add(i)
                indices.append(i)

        return [self.words[i] for i in indices]

    def handle(self, word: str):
        word = str(word).strip().lower()
        if not word:
            return False
        if word in self.words:
            return False
        idx = len(self.words)
        self.words.append(word)
        self.insert(word, idx)
        self._save_data()
        return True

    def response(self):
        return "Hello from Trie"

trie = Trie()
