"use client";

type Props = {
  urls: string[];
  onChange: (next: string[]) => void;
  max?: number;
};

export function UrlInputList({ urls, onChange, max = 5 }: Props) {
  const rows = urls.length === 0 ? [""] : urls;

  function updateAt(i: number, value: string) {
    const next = [...rows];
    next[i] = value;
    onChange(next.filter((u) => u.length > 0));
  }

  function removeAt(i: number) {
    const next = rows.filter((_, idx) => idx !== i);
    onChange(next.filter((u) => u.length > 0));
  }

  function addRow() {
    if (rows.length >= max) return;
    onChange([...rows.filter((u) => u.length > 0), ""]);
  }

  return (
    <div style={{ display: "grid", gap: 8 }}>
      {rows.map((url, i) => (
        <div key={i} style={{ display: "flex", gap: 6 }}>
          <input
            className="input"
            type="url"
            placeholder="https://example.com/about"
            value={url}
            onChange={(e) => updateAt(i, e.target.value)}
            style={{ flex: 1 }}
          />
          <button
            className="btn ghost"
            onClick={() => removeAt(i)}
            disabled={rows.length === 1 && url === ""}
            type="button"
            aria-label="URL 제거"
            style={{ width: 36 }}
          >
            ×
          </button>
        </div>
      ))}
      <button
        className="btn ghost"
        onClick={addRow}
        disabled={rows.length >= max}
        type="button"
        style={{ alignSelf: "flex-start" }}
      >
        + URL 추가 ({rows.length}/{max})
      </button>
    </div>
  );
}
