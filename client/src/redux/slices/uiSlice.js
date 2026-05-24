import { createSlice } from '@reduxjs/toolkit';

// ── Read persisted theme (or fall back to system preference) ──────────────────
function getInitialTheme() {
  try {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || stored === 'light') return stored;
    // Respect OS preference when no stored value
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
  } catch {}
  return 'light';
}

// ── Apply the class to <html> immediately (called on every theme change) ──────
function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  try {
    localStorage.setItem('theme', theme);
  } catch {}
}

const initialTheme = getInitialTheme();
// Apply on module load so the class is set before React renders
applyTheme(initialTheme);

const language = (() => {
  try { return localStorage.getItem('language') || 'en'; } catch { return 'en'; }
})();

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    theme: initialTheme,
    language,
    sidebarOpen: false,
    toasts: [],
  },
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      applyTheme(state.theme);
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
      applyTheme(action.payload);
    },
    setLanguage: (state, action) => {
      state.language = action.payload;
      try { localStorage.setItem('language', action.payload); } catch {}
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    addToast: (state, action) => {
      state.toasts.push({ id: Date.now(), ...action.payload });
    },
    removeToast: (state, action) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
  },
});

export const {
  toggleTheme, setTheme, setLanguage,
  toggleSidebar, setSidebarOpen,
  addToast, removeToast,
} = uiSlice.actions;

export default uiSlice.reducer;
