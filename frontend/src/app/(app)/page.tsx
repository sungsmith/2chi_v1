import { HomeBanner } from "@/components/home/home-banner";

export default function Home() {
  return (
    <section style={{ padding: "var(--space-12)" }}>
      <HomeBanner />
      <h1 style={{ fontFamily: "var(--font-family-hand)", fontSize: "var(--fs-page-title)" }}>
        2chi · 이취
      </h1>
      <p style={{ color: "var(--color-text-secondary)" }}>
        취업·이직 올인원 워크스페이스. v1 셋업 완료.
      </p>
    </section>
  );
}
