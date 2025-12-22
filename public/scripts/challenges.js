'use strict';

const PROJECT_ID = 'ai-python-ide';
const DEFAULT_API_BASE = '/api';
const LOCAL_FUNCTIONS_API = `http://localhost:5001/${PROJECT_ID}/us-central1/api`;
const API_BASE = resolveApiBase();
const STATUS_VARIANTS = {
  idle: { label: 'Not attempted', className: '' },
  running: { label: 'Running tests…', className: 'status-badge--pending' },
  pass: { label: 'All tests passed', className: 'status-badge--passed' },
  fail: { label: 'Needs work', className: 'status-badge--failed' },
  error: { label: 'Error', className: 'status-badge--failed' },
};

const STORAGE_PREFIX = 'challenge-code-';

document.addEventListener('DOMContentLoaded', () => {
  const cards = document.querySelectorAll('.card[data-challenge-id]');
  cards.forEach((card) => attachCardHandlers(card));
});

function resolveApiBase() {
  const { hostname, port } = window.location;
  const isLiveDevServer = ['5500', '5173', '3000'].includes(port);
  const isLocalHost = hostname === '127.0.0.1' || hostname === 'localhost';

  if (isLocalHost && isLiveDevServer) {
    return LOCAL_FUNCTIONS_API;
  }

  return DEFAULT_API_BASE;
}

function attachCardHandlers(card) {
  const challengeId = card.dataset.challengeId;
  const textarea = card.querySelector('textarea');
  const button = card.querySelector('.submit-btn');
  const resultEl = card.querySelector('.result');
  const statusEl = document.getElementById(`status-${challengeId}`);

  hydrateFromStorage(challengeId, textarea);

  textarea.addEventListener('input', () => persistDraft(challengeId, textarea.value));

  button.addEventListener('click', async () => {
    const code = textarea.value;
    if (!code.trim()) {
      renderInlineError(resultEl, 'Please write some code before running the tests.');
      updateStatus(statusEl, 'fail', 'No code');
      return;
    }

    await submitChallenge({ challengeId, code, button, resultEl, statusEl });
  });
}

async function submitChallenge({ challengeId, code, button, resultEl, statusEl }) {
  setButtonState(button, true, 'Running…');
  updateStatus(statusEl, 'running');
  renderInlineInfo(resultEl, '⏳ Evaluating your code…');

  try {
    const response = await fetch(`${API_BASE}/challenges/${challengeId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ code }),
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload?.error || 'Server error while grading code.');
    }

    renderResult(payload, resultEl, statusEl);
  } catch (error) {
    console.error('challenge submission failed', error);
    renderInlineError(resultEl, error.message || 'Unexpected error.');
    updateStatus(statusEl, 'error', 'Error');
  } finally {
    setButtonState(button, false, 'Run Tests');
  }
}

function renderResult(payload, resultEl, statusEl) {
  const {
    passed = false,
    tests = [],
    missingEntryPoint,
    setupError,
    stdout = '',
    stderr = '',
  } = payload || {};

  if (missingEntryPoint) {
    updateStatus(statusEl, 'fail', 'Missing function');
    resultEl.innerHTML = createHtmlBlock({
      summary: `Define the function <code>${escapeHTML(missingEntryPoint)}</code> exactly as described before running tests.`,
      summaryClass: 'fail',
    });
    return;
  }

  if (setupError) {
    updateStatus(statusEl, 'fail', 'Crashed');
    resultEl.innerHTML = createHtmlBlock({
      summary: `Your code crashed before tests could run: ${escapeHTML(setupError)}`,
      summaryClass: 'fail',
      stderr,
    });
    return;
  }

  const failedCount = tests.filter((test) => !test.passed).length;
  const summaryClass = passed ? 'pass' : 'fail';
  const summaryText = tests.length
    ? passed
      ? '✅ All tests passed!'
      : `❌ ${failedCount} of ${tests.length} tests failed.`
    : '⚠️ Tests did not return any results.';

  updateStatus(statusEl, passed ? 'pass' : 'fail');

  resultEl.innerHTML = createHtmlBlock({
    summary: summaryText,
    summaryClass,
    tests,
    stdout,
    stderr,
  });
}

function createHtmlBlock({ summary, summaryClass, tests = [], stdout, stderr }) {
  const testList = tests.length ? renderTests(tests) : '';
  const logs = renderLogs({ stdout, stderr });
  return `
    <p class="result-summary ${summaryClass}">${summary}</p>
    ${testList}
    ${logs}
  `;
}

function renderTests(tests) {
  const rows = tests
    .map((test) => {
      const badge = test.passed ? '✅' : '⚠️';
      const valueLabel = test.passed
        ? `Got ${formatValue(test.value)}`
        : `Expected ${formatValue(test.expected)} but got ${formatValue(test.value)}`;
      const details = test.error
        ? escapeHTML(test.error)
        : valueLabel;
      return `
        <li class="test-row ${test.passed ? 'pass' : 'fail'}">
          <span>${badge} Test ${test.index}</span>
          <span>${details}</span>
        </li>
      `;
    })
    .join('');

  return `<ul class="test-list">${rows}</ul>`;
}

function renderLogs({ stdout, stderr }) {
  const parts = [];
  if (stderr) {
    parts.push(`
      <details class="log-block" open>
        <summary>stderr</summary>
        <pre>${escapeHTML(stderr)}</pre>
      </details>
    `);
  }
  if (stdout) {
    parts.push(`
      <details class="log-block">
        <summary>stdout</summary>
        <pre>${escapeHTML(stdout)}</pre>
      </details>
    `);
  }
  return parts.join('');
}

function updateStatus(statusEl, variant, customLabel) {
  if (!statusEl) return;
  statusEl.className = `status-badge ${STATUS_VARIANTS[variant]?.className || ''}`.trim();
  const fallback = STATUS_VARIANTS[variant]?.label || STATUS_VARIANTS.idle.label;
  statusEl.textContent = customLabel || fallback;
}

function setButtonState(button, disabled, label) {
  if (!button) return;
  button.disabled = disabled;
  if (label) {
    button.textContent = label;
  }
}

function renderInlineError(target, message) {
  if (!target) return;
  target.innerHTML = `<p class="result-summary fail">${escapeHTML(message)}</p>`;
}

function renderInlineInfo(target, message) {
  if (!target) return;
  target.innerHTML = `<p class="result-summary pending">${escapeHTML(message)}</p>`;
}

function formatValue(value) {
  try {
    if (typeof value === 'string') {
      return `"${value}"`;
    }
    return JSON.stringify(value);
  } catch (error) {
    return String(value);
  }
}

function escapeHTML(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function hydrateFromStorage(challengeId, textarea) {
  try {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}${challengeId}`);
    if (saved && textarea) {
      textarea.value = saved;
    }
  } catch (error) {
    console.warn('Unable to read saved code', error);
  }
}

function persistDraft(challengeId, value) {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${challengeId}`, value);
  } catch (error) {
    console.warn('Unable to save code draft', error);
  }
}

