"use client";

import { useRef, useEffect, useCallback } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightSpecialChars, drawSelection, highlightActiveLine, rectangularSelection, crosshairCursor } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { python } from "@codemirror/lang-python";
import { oneDark } from "@codemirror/theme-one-dark";
import { syntaxHighlighting, defaultHighlightStyle, indentOnInput, bracketMatching, foldGutter, foldKeymap } from "@codemirror/language";
import { closeBrackets, closeBracketsKeymap, autocompletion, completionKeymap } from "@codemirror/autocomplete";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import { lintKeymap } from "@codemirror/lint";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: string;
  language?: "python";
  readOnly?: boolean;
  className?: string;
}

// Custom dark theme to match the app's aesthetic
const appTheme = EditorView.theme({
  "&": {
    backgroundColor: "#1e1e1e",
    color: "#d4d4d4",
    fontSize: "13px",
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
  },
  ".cm-content": {
    caretColor: "#6c5ce7",
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
    padding: "8px 0",
  },
  ".cm-cursor, .cm-dropCursor": {
    borderLeftColor: "#6c5ce7",
    borderLeftWidth: "2px",
  },
  "&.cm-focused .cm-cursor": {
    borderLeftColor: "#6c5ce7",
  },
  ".cm-gutters": {
    backgroundColor: "#1e1e1e",
    color: "#858585",
    border: "none",
    borderRight: "1px solid rgba(255, 255, 255, 0.06)",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "rgba(108, 92, 231, 0.1)",
    color: "#a29bfe",
  },
  ".cm-activeLine": {
    backgroundColor: "rgba(108, 92, 231, 0.06)",
  },
  ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": {
    backgroundColor: "rgba(108, 92, 231, 0.3) !important",
  },
  ".cm-matchingBracket": {
    backgroundColor: "rgba(108, 92, 231, 0.25)",
    outline: "1px solid rgba(108, 92, 231, 0.5)",
  },
  ".cm-searchMatch": {
    backgroundColor: "rgba(254, 202, 87, 0.3)",
  },
  ".cm-searchMatch.cm-searchMatch-selected": {
    backgroundColor: "rgba(254, 202, 87, 0.5)",
  },
  ".cm-scroller": {
    overflow: "auto",
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
  },
  ".cm-tooltip": {
    backgroundColor: "#12121e",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "8px",
  },
  ".cm-tooltip-autocomplete": {
    "& > ul > li[aria-selected]": {
      backgroundColor: "rgba(108, 92, 231, 0.2)",
    },
  },
  // Scrollbar styles
  ".cm-scroller::-webkit-scrollbar": {
    width: "6px",
    height: "6px",
  },
  ".cm-scroller::-webkit-scrollbar-track": {
    background: "transparent",
  },
  ".cm-scroller::-webkit-scrollbar-thumb": {
    background: "rgba(108, 92, 231, 0.3)",
    borderRadius: "9999px",
  },
  ".cm-scroller::-webkit-scrollbar-thumb:hover": {
    background: "rgba(108, 92, 231, 0.5)",
  },
}, { dark: true });

export default function CodeEditor({
  value,
  onChange,
  height = "220px",
  readOnly = false,
  className = "",
}: CodeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);

  // Keep onChange ref up to date without recreating the editor
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const createExtensions = useCallback(() => {
    return [
      // Line numbers & gutter
      lineNumbers(),
      highlightActiveLineGutter(),
      foldGutter(),

      // History (undo/redo)
      history(),

      // Editing helpers
      drawSelection(),
      highlightActiveLine(),
      highlightSpecialChars(),
      indentOnInput(),
      bracketMatching(),
      closeBrackets(),
      rectangularSelection(),
      crosshairCursor(),
      highlightSelectionMatches(),

      // Autocomplete
      autocompletion(),

      // Keymaps
      keymap.of([
        ...closeBracketsKeymap,
        ...defaultKeymap,
        ...searchKeymap,
        ...historyKeymap,
        ...foldKeymap,
        ...completionKeymap,
        ...lintKeymap,
        indentWithTab,
      ]),

      // Language
      python(),

      // Theme
      oneDark,
      appTheme,
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),

      // Read-only
      ...(readOnly ? [EditorState.readOnly.of(true)] : []),

      // Word wrap
      EditorView.lineWrapping,

      // Listen for changes
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          onChangeRef.current(update.state.doc.toString());
        }
      }),
    ];
  }, [readOnly]);

  // Create editor on mount
  useEffect(() => {
    if (!containerRef.current) return;

    const state = EditorState.create({
      doc: value,
      extensions: createExtensions(),
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // Only run on mount — value updates handled below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createExtensions]);

  // Sync external value changes into the editor (e.g. reset, challenge switch)
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const currentDoc = view.state.doc.toString();
    if (currentDoc !== value) {
      view.dispatch({
        changes: {
          from: 0,
          to: currentDoc.length,
          insert: value,
        },
      });
    }
  }, [value]);

  return (
    <div
      ref={containerRef}
      className={`rounded-lg overflow-hidden ${className}`}
      style={{ height }}
    />
  );
}
