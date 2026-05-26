"use client";

import { SignupErrors } from "@/lib/validation/signup";

type Props = {
  ageConfirmed: boolean;
  terms: boolean;
  privacy: boolean;
  marketing: boolean;
  onChange: (key: "ageConfirmed" | "terms" | "privacy" | "marketing", value: boolean) => void;
  errors: SignupErrors;
};

export function ConsentSection({ ageConfirmed, terms, privacy, marketing, onChange, errors }: Props) {
  const agreeAll = ageConfirmed && terms && privacy && marketing;

  function toggleAll() {
    const next = !agreeAll;
    onChange("ageConfirmed", next);
    onChange("terms", next);
    onChange("privacy", next);
    onChange("marketing", next);
  }

  return (
    <div className="auth-terms">
      <div className={"all" + (agreeAll ? " on" : "")} onClick={toggleAll} role="checkbox" aria-checked={agreeAll} tabIndex={0}>
        <span className={"box" + (agreeAll ? " on" : "")} />
        전체 동의
      </div>

      <div
        className={"item" + (terms ? " on" : "") + (errors.terms ? " err" : "")}
        onClick={() => onChange("terms", !terms)}
        role="checkbox"
        aria-checked={terms}
        tabIndex={0}
      >
        <span className="box" />
        <span className="req">[필수]</span>
        서비스 이용약관
        <a className="view" href="/terms" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>보기</a>
      </div>
      {errors.terms && <span className="helper error">{errors.terms}</span>}

      <div
        className={"item" + (privacy ? " on" : "") + (errors.privacy ? " err" : "")}
        onClick={() => onChange("privacy", !privacy)}
        role="checkbox"
        aria-checked={privacy}
        tabIndex={0}
      >
        <span className="box" />
        <span className="req">[필수]</span>
        개인정보 수집·이용 동의
        <a className="view" href="/privacy" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>보기</a>
      </div>
      {errors.privacy && <span className="helper error">{errors.privacy}</span>}

      <div
        className={"item" + (ageConfirmed ? " on" : "") + (errors.ageConfirmed ? " err" : "")}
        onClick={() => onChange("ageConfirmed", !ageConfirmed)}
        role="checkbox"
        aria-checked={ageConfirmed}
        tabIndex={0}
      >
        <span className="box" />
        <span className="req">[필수]</span>
        만 14세 이상 확인
      </div>
      {errors.ageConfirmed && <span className="helper error">{errors.ageConfirmed}</span>}

      <div
        className={"item" + (marketing ? " on" : "")}
        onClick={() => onChange("marketing", !marketing)}
        role="checkbox"
        aria-checked={marketing}
        tabIndex={0}
      >
        <span className="box" />
        <span className="opt">[선택]</span>
        마케팅 정보 수신 동의
      </div>
    </div>
  );
}
