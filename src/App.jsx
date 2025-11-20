import React, { useEffect, useMemo, useRef, useState } from 'react';
import Trie from './trie';
import './styles.css';

// Sample dataset: word -> frequency. In real project replace with larger CSV or JSON file.
const SAMPLE = [
  ['app', 300],
  ['apple', 120],
  ['application', 90],
  ['apply', 60],
  ['apartment', 40],
  ['ape', 20],
  ['banana', 200],
  ['band', 80],
  ['bandwidth', 30],
  ['bank', 150],
  ['cat', 120],
  ['caterpillar', 60],
  ['category', 50],
  ['dog', 180],
  ['dodge', 40],
  ['doors', 30],
  ['dot', 25],
  ['data', 220],
  ['date', 210],
  ['dashboard', 70],
];

export default function App() {
  const trie = useMemo(() => new Trie(8), []);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [fuzzy, setFuzzy] = useState(false);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  // Load sample data into trie once
  useEffect(() => {
    for (const [w, f] of SAMPLE) trie.insert(w.toLowerCase(), f);
  }, [trie]);

  // Load recent searches
  const getRecent = () => JSON.parse(localStorage.getItem('recentSearches') || '[]');
  const addRecent = (q) => {
    if (!q) return;
    const rec = getRecent().filter((x) => x !== q);
    rec.unshift(q);
    if (rec.length > 10) rec.length = 10;
    localStorage.setItem('recentSearches', JSON.stringify(rec));
  };

  // Debounced search logic
  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!query) {
      setSuggestions(getRecent());
      setShowSuggestions(true);
      setActiveIndex(-1);
      return;
    }
    debounceRef.current = setTimeout(() => {
      const q = query.toLowerCase();
      let res = trie.getTopK(q);
      if (fuzzy && res.length === 0) {
        res = trie.fuzzyIncludes(q);
      }
      setSuggestions(res);
      setShowSuggestions(true);
      setActiveIndex(-1);
    }, 120); // small debounce
    return () => clearTimeout(debounceRef.current);
  }, [query, trie, fuzzy]);

  const handleInput = (e) => {
    setQuery(e.target.value);
  };

  const choose = (value) => {
    setQuery(value);
    setShowSuggestions(false);
    addRecent(value);
  };

  const onKeyDown = (e) => {
    if (!showSuggestions) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        choose(suggestions[activeIndex]);
      } else {
        choose(query);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const highlight = (word) => {
    const q = query;
    if (!q) return word;
    const idx = word.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return word;
    return (
      <>
        {word.slice(0, idx)}
        <strong>{word.slice(idx, idx + q.length)}</strong>
        {word.slice(idx + q.length)}
      </>
    );
  };

  return (
    <div className="app-root">
      <div className="card">
        <h1>Autocomplete — Trie (No Backend)</h1>
        <div className="controls">
          <label className="fuzzy-toggle">
            <input type="checkbox" checked={fuzzy} onChange={(e) => setFuzzy(e.target.checked)} />{' '}
            Fuzzy includes fallback
          </label>
        </div>

        <div className="search-wrap">
          <input
            ref={inputRef}
            className="search-input"
            value={query}
            onChange={handleInput}
            onKeyDown={onKeyDown}
            onFocus={() => { if (!query) setSuggestions(getRecent()); setShowSuggestions(true); }}
            placeholder="Type to search (e.g. 'app', 'ban', 'da')"
            aria-label="Search"
          />

          {showSuggestions && (
            <ul className="suggestions" role="listbox">
              {suggestions.length === 0 && <li className="empty">No suggestions</li>}
              {suggestions.map((s, idx) => (
                <li
                  key={s + idx}
                  className={idx === activeIndex ? 'active' : ''}
                  onMouseDown={(ev) => { ev.preventDefault(); choose(s); }}
                  onMouseEnter={() => setActiveIndex(idx)}
                >
                  {highlight(s)}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="help">
          <p>Try typing: <em>app</em>, <em>ban</em>, <em>da</em>, <em>cat</em></p>
          <p>Recent searches are stored in localStorage.</p>
        </div>
      </div>

      <footer className="footer">Made with 🔺 Trie — Deploy to Netlify / Vercel</footer>
    </div>
  );
}
