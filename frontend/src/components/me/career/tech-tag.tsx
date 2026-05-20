"use client";

type Props = {
  label: string;
  onDelete?: () => void;
};

export function TechTag({ label, onDelete }: Props) {
  return (
    <span className="tech-tag">
      {label}
      {onDelete && (
        <button
          type="button"
          aria-label="삭제"
          onClick={onDelete}
          style={{ marginLeft: 4, background: "transparent", border: 0, cursor: "pointer", color: "currentColor" }}
        >
          ×
        </button>
      )}
    </span>
  );
}
