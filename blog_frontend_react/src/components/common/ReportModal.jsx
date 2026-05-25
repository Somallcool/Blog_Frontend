import { useState } from "react";
import "./ReportModal.css";

const REPORT_REASONS = [
  "욕설 / 혐오 표현",
  "스팸 / 도배",
  "개인정보 노출",
  "음란물 / 불건전한 내용",
  "허위사실 / 사기",
  "기타",
];

/**
 * ReportModal
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {function} props.onClose
 * @param {'board' | 'comment'} props.targetType - 신고 대상 타입
 * @param {number} props.targetId -신고 대상 ID (numberId)
 * @param {function} props.onSubmit - (targetId, reason, detail) => Promise<void>
 */

export default function ReportModal({
  isOpen,
  onClose,
  targetType,
  targetId,
  onSubmit,
}) {
  const [selectedReason, setSelectedReason] = useState("");
  const [detail, setDetail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setSelectedReason("");
    setDetail("");
    setDone(false);
    onClose();
  };

  const handleSubmit = async () => {
    if (!selectedReason) return;
    setLoading(true);
    try {
      await onSubmit(targetId, selectedReason, detail);
      setDone(true);
    } catch (e) {
      alert("신고 접수 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rm-overlay" onClick={handleClose}>
      <div className="rm-panel" onClick={(e) => e.stopPropagation()}>
        {done ? (
          <div className="rm-done">
            <div className="rm-done-icon">✓</div>
            <p className="rm-done-title">신고가 접수되었습니다.</p>
            <p className="rm-done-sub">검토 후 적절한 조취를 취하겠습니다.</p>
            <button className="rm-btn-primary" onClick={handleClose}>
              확인
            </button>
          </div>
        ) : (
          <>
            <div className="rm-header">
              <span className="rm-title">
                {targetType === "comment" ? "댓글 신고" : "게시글 신고"}
              </span>
              <button
                className="rm-close"
                onClick={handleClose}
                aria-label="닫기"
              >
                ✕
              </button>
            </div>

            <p className="rm-label">신고 사유를 선택해 주세요</p>
            <ul className="rm-reasons">
              {REPORT_REASONS.map((r) => (
                <li
                  key={r}
                  className={`rm-reason-item ${selectedReason === r ? "rm-reason-item--active" : ""}`}
                  onClick={() => setSelectedReason(r)}
                >
                  <span className="rm-radio" />
                  {r}
                </li>
              ))}
            </ul>

            <label className="rm-label" htmlFor="rm-detail">
              추가 내용 (선택)
            </label>
            <textarea
              id="rm-detail"
              className="rm-textarea"
              placeholder="구체적인 내용을 적어주시면 빠른 처리에 도움이 됩니다."
              maxLength={300}
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
            />
            <span className="rm-count">{detail.length}/300</span>

            <div className="rm-footer">
              <button className="rm-btn-cancel" onClick={handleClose}>
                취소
              </button>
              <button
                className="rm-btn-primary"
                onClick={handleSubmit}
                disabled={!selectedReason || loading}
              >
                {loading ? "접수 중..." : "신고하기"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
