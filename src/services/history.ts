export interface HistoryItem {
  id: string;
  date: string;
  classification: string | null;
  risk_level: string;
  evidence_coverage: number;
  status: string;
}

const STORAGE_KEY = 'pathfinder_health_history_v1';

export function getLocalHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

export function saveToLocalHistory(item: HistoryItem): void {
  try {
    const existing = getLocalHistory();
    // Prepend and cap at 30 items
    const updated = [item, ...existing.filter((h) => h.id !== item.id)].slice(0, 30);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (_) {}
}

export function deleteLocalHistoryItem(id: string): void {
  try {
    const existing = getLocalHistory();
    const updated = existing.filter((h) => h.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (_) {}
}

export function clearLocalHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (_) {}
}
