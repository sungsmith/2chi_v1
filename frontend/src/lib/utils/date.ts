/**
 * 로컬 시간대 기준 YYYY-MM-DD 문자열로 변환.
 * `toISOString().slice(0, 10)` 은 UTC 변환이라 KST(UTC+9) 환경에서
 * 자정 직후 하루 차이가 발생함. 캘린더 그리드처럼 사용자 로컬 일자가
 * 기준이 되는 곳에서는 이 헬퍼를 사용.
 */
export function toLocalIso(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
