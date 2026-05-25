type Size = "sm" | "md" | "lg" | "xl";
type Expression = "default" | "wave" | "happy" | "think" | "excited" | "sleep";

type Props = {
  size?: Size;
  expression?: Expression;
};

export function MascotCloud({ size = "md", expression = "default" }: Props) {
  return <span className={`mascot-cloud ${size} ${expression}`} aria-hidden="true" />;
}
