import { useState, useEffect, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet, apiPost, apiDelete } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import "./AdminReportsPage.css";

/**
 * AdminReportsPage - /admin/reports
 * ROLE_ADMIN 만 접근 가능 (어드민 아니면 홈으로 리다이렉트)
 *
 * API 연동:
 *  - GET    /boards/admin/members/{memberId}/reports  → 특정 회원 신고 내역
 *  - GET    /reports                                  → 전체 신고 목록 (백엔드 구현에 따라 경로 조정)
 *  - POST   /boards/admin/members/{memberId}/block    → 차단
 *  - DELETE /boards/admin/members/{memberId}/block    → 차단 해제
 *  - DELETE /boards/admin/{boardId}                   → 게시글 강제 삭제
 *  - DELETE /boards/admin/comments/{commentId}        → 댓글 강제 삭제
 */
export default function AdminReportsPage() {
  const navigate = useNavigate();
  //   const { user } = useAuth(); // AuthContext에서 로그인 유저 정보

  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [filter, setFilter] = useState("ALL"); // ALL | ACTIVE | BLOCKED
  const [searchId, setSearchId] = useState("");
  const [expandedMember, setExpandedMember] = useState(null);
  const [toast, setToast] = useState(null);
  const { user, loading: authLoading } = useAuth();
  // ── 어드민 가드 ──────────────────────────────────────────────

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/login");
      return;
    }
    if (user.role !== "ROLE_ADMIN") {
      navigate("/");
      return;
    }
    fetchReports();
  }, [user, authLoading]);
  // ────────────────────────────────────────────────────────────

  const fetchReports = async () => {
    setReportsLoading(true);
    try {
      const data = await apiGet("/boards/admin/reports");
      setReports(data || []);
    } catch (e) {
      console.error("신고 목록 조회 실패", e);
      setReports([]);
    } finally {
      setReportsLoading(false);
    }
  };

  // ── 회원별 집계 ──────────────────────────────────────────────
  const memberMap = {};
  reports.forEach((r) => {
    if (!memberMap[r.reportedMemberId]) {
      memberMap[r.reportedMemberId] = {
        memberId: r.reportedMemberId,
        nickname: r.reportedNickname,
        status: r.memberStatus,
        reports: [],
      };
    }
    memberMap[r.reportedMemberId].reports.push(r);
  });

  let members = Object.values(memberMap);
  if (filter === "ACTIVE")
    members = members.filter((m) => m.status === "ACTIVE");
  if (filter === "BLOCKED")
    members = members.filter((m) => m.status === "BLOCKED");
  if (searchId.trim())
    members = members.filter((m) =>
      String(m.memberId).includes(searchId.trim()),
    );

  const totalReports = reports.length;
  const blockedCount = Object.values(memberMap).filter(
    (m) => m.status === "BLOCKED",
  ).length;
  const pendingCount = Object.values(memberMap).filter(
    (m) => m.status === "ACTIVE" && m.reports.length >= 3,
  ).length;
  // ────────────────────────────────────────────────────────────

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const toggleBlock = async (memberId) => {
    const member = memberMap[memberId];
    const isBlocked = member.status === "BLOCKED";
    try {
      if (isBlocked) {
        await apiDelete(`/boards/admin/members/${memberId}/block`);
      } else {
        await apiPost(`/boards/admin/members/${memberId}/block`, {});
      }
      // 로컬 상태 즉시 반영
      setReports((prev) =>
        prev.map((r) =>
          r.reportedMemberId === memberId
            ? { ...r, memberStatus: isBlocked ? "ACTIVE" : "BLOCKED" }
            : r,
        ),
      );
      showToast(
        `${member.nickname}님을 ${isBlocked ? "차단 해제" : "차단"}했습니다.`,
      );
    } catch (e) {
      console.error("차단 처리 실패", e);
      showToast("처리 중 오류가 발생했습니다.");
    }
  };

  const deleteContent = async (reportId, type, contentId) => {
    try {
      if (type === "board") {
        await apiDelete(`/boards/admin/${contentId}`);
      } else {
        await apiDelete(`/boards/admin/comments/${contentId}`);
      }
      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId ? { ...r, contentDeleted: true } : r,
        ),
      );
      showToast(`${type === "board" ? "게시글" : "댓글"}을 삭제했습니다.`);
    } catch (e) {
      console.error("콘텐츠 삭제 실패", e);
      showToast("삭제 중 오류가 발생했습니다.");
    }
  };

  if (authLoading || reportsLoading) {
    return (
      <div className="ar-page">
        <div className="ar-loading">신고 내역을 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="ar-page">
      <h1 className="ar-page-title">신고 관리</h1>

      {/* 요약 카드 */}
      <div className="ar-summary">
        <div className="ar-stat-card">
          <span className="ar-stat-label">전체 신고</span>
          <span className="ar-stat-value">{totalReports}</span>
        </div>
        <div className="ar-stat-card ar-stat-card--warn">
          <span className="ar-stat-label">차단 대기 (3회↑)</span>
          <span className="ar-stat-value ar-stat-value--warn">
            {pendingCount}
          </span>
        </div>
        <div className="ar-stat-card ar-stat-card--blocked">
          <span className="ar-stat-label">차단된 회원</span>
          <span className="ar-stat-value ar-stat-value--blocked">
            {blockedCount}
          </span>
        </div>
      </div>

      {/* 필터 / 검색 */}
      <div className="ar-toolbar">
        <div className="ar-filter-tabs">
          {["ALL", "ACTIVE", "BLOCKED"].map((f) => (
            <button
              key={f}
              className={`ar-tab ${filter === f ? "ar-tab--active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f === "ALL" ? "전체" : f === "ACTIVE" ? "활성" : "차단됨"}
            </button>
          ))}
        </div>
        <input
          className="ar-search"
          placeholder="회원 ID 검색"
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
        />
      </div>

      {/* 신고 테이블 */}
      <div className="ar-table-wrap">
        <table className="ar-table">
          <thead>
            <tr>
              <th>회원 ID</th>
              <th>닉네임</th>
              <th>신고 횟수</th>
              <th>상태</th>
              <th>조치</th>
              <th>내역</th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 && (
              <tr>
                <td colSpan={6} className="ar-empty">
                  신고 내역이 없습니다.
                </td>
              </tr>
            )}
            {members.map((m) => (
              <Fragment key={m.memberId}>
                <tr className={m.status === "BLOCKED" ? "ar-row--blocked" : ""}>
                  <td className="ar-td-id">{m.memberId}</td>
                  <td className="ar-td-nick">{m.nickname}</td>
                  <td>
                    <span
                      className={`ar-badge-count ${m.reports.length >= 3 ? "ar-badge-count--danger" : ""}`}
                    >
                      {m.reports.length}회
                    </span>
                  </td>
                  <td>
                    <span
                      className={`ar-status-badge ${m.status === "BLOCKED" ? "ar-status-badge--blocked" : "ar-status-badge--active"}`}
                    >
                      {m.status === "BLOCKED" ? "차단됨" : "활성"}
                    </span>
                  </td>
                  <td>
                    <button
                      className={`ar-btn-action ${m.status === "BLOCKED" ? "ar-btn-action--unblock" : "ar-btn-action--block"}`}
                      onClick={() => toggleBlock(m.memberId)}
                    >
                      {m.status === "BLOCKED" ? "차단 해제" : "차단"}
                    </button>
                  </td>
                  <td>
                    <button
                      className="ar-btn-expand"
                      onClick={() =>
                        setExpandedMember(
                          expandedMember === m.memberId ? null : m.memberId,
                        )
                      }
                    >
                      {expandedMember === m.memberId ? "접기 ▲" : "상세 ▼"}
                    </button>
                  </td>
                </tr>

                {/* 신고 상세 펼침 */}
                {expandedMember === m.memberId && (
                  <tr className="ar-row-detail">
                    <td colSpan={6}>
                      <table className="ar-detail-table">
                        <thead>
                          <tr>
                            <th>신고 ID</th>
                            <th>신고자</th>
                            <th>사유</th>
                            <th>대상 타입</th>
                            <th>신고일</th>
                            <th>콘텐츠 조치</th>
                          </tr>
                        </thead>
                        <tbody>
                          {m.reports.map((r) => (
                            <tr key={r.reportId}>
                              <td>#{r.reportId}</td>
                              <td>{r.reporterNickname}</td>
                              <td>{r.reason}</td>
                              <td>
                                <span
                                  className={`ar-type-badge ${r.targetType === "board" ? "ar-type-badge--board" : "ar-type-badge--comment"}`}
                                >
                                  {r.targetType === "board" ? "게시글" : "댓글"}
                                </span>
                              </td>
                              <td className="ar-td-date">{r.createdAt}</td>
                              <td>
                                {r.contentDeleted ? (
                                  <span className="ar-deleted-label">
                                    삭제됨
                                  </span>
                                ) : (
                                  <button
                                    className="ar-btn-del-content"
                                    onClick={() =>
                                      deleteContent(
                                        r.reportId,
                                        r.targetType,
                                        r.targetType === "board"
                                          ? r.boardId
                                          : r.commentId,
                                      )
                                    }
                                  >
                                    {r.targetType === "board"
                                      ? "게시글 삭제"
                                      : "댓글 삭제"}
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* 토스트 */}
      {toast && <div className="ar-toast">{toast}</div>}
    </div>
  );
}
