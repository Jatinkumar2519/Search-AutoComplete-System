import streamlit as st
import requests
from urllib.parse import quote

# ------------------ PAGE CONFIG ------------------
st.set_page_config(
    page_title="Trie Autocomplete",
    page_icon="🔍",
    layout="centered"
)

st.title("🔍 Trie Autocomplete System")

# ------------------ CACHE API CALL ------------------
@st.cache_data(show_spinner=False)
def fetch_suggestions(prefix: str):
    """
    Fetch autocomplete suggestions from FastAPI backend (URL-encoded)
    """
    prefix = str(prefix or "").strip()
    if not prefix:
        return []
    try:
        encoded = quote(prefix, safe='')
        res = requests.get(
            f"http://127.0.0.1:8000/autocomplete/{encoded}",
            timeout=2
        )
        if res.status_code == 200:
            return res.json().get("suggestions", [])
    except Exception:
        return []
    return []

# ------------------ SESSION STATE INIT ------------------
if "suggestions" not in st.session_state:
    st.session_state.suggestions = []

# ------------------ INPUT (LIVE) ------------------
# use a named key so we can clear the input after insert
prefix = st.text_input(
    "Start typing...",
    placeholder="Type a word...",
    key="prefix"
)

button = st.button("Insert")

if button:
    val = st.session_state.get("prefix", "").strip()
    if val:
        try:
            encoded = quote(val, safe='')
            res = requests.post(
                f"http://127.0.0.1:8000/insert/{encoded}",
                timeout=2
            )
            if res.status_code == 200:
                st.success(f"Inserted: {val}")
                # clear input, suggestions and cache so newly inserted word is visible
                st.session_state.prefix = ""
                st.session_state.suggestions = []
                try:
                    st.cache_data.clear()
                except Exception:
                    pass
            else:
                try:
                    detail = res.json().get("detail")
                except Exception:
                    detail = res.text
                st.error(f"Insert failed: {detail}")
        except Exception:
            st.error("Insert failed")
# ------------------ LOGIC (RUNS ON EVERY KEYSTROKE) ------------------
if prefix.strip():
    try:
        st.session_state.suggestions = fetch_suggestions(prefix)
    except Exception:
        st.session_state.suggestions = []
else:
    st.session_state.suggestions = []

# ------------------ UI ------------------
st.markdown("### Suggestions")

if st.session_state.suggestions:
    for word in st.session_state.suggestions:
        st.markdown(f"- **{word}**")
else:
    st.info("No suggestions yet")

# ------------------ OPTIONAL RESET ------------------
if st.button("Reset"):
    st.session_state.suggestions = []
    st.rerun()
