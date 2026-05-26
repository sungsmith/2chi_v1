// CalendarLegend: stage-legend section — matches mock STAGE_LEGEND pattern.
const ITEMS = [
  { cls: "doc",  label: "서류" },
  { cls: "code", label: "코딩테스트" },
  { cls: "int1", label: "1차면접" },
  { cls: "int2", label: "2차면접" },
  { cls: "exec", label: "임원면접" },
  { cls: "ok",   label: "합격" },
  { cls: "fail", label: "불합격" },
];

export function CalendarLegend() {
  return (
    <section className="stage-legend">
      {ITEMS.map((item) => (
        <span key={item.cls} className="item">
          <span className={"dot " + item.cls} />
          {item.label}
        </span>
      ))}
    </section>
  );
}
