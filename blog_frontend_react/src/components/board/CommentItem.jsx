import { useState } from "react";
import { apiPostJson, apiDelete } from "../../services/api";
import "./CommentItem.css";

const CommentItem = ({ comment, boardId, onRefresh, onReport }) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [showReplies, setShowReplies] = useState(false);

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    try {
      await apiPostJson(`/boards/${boardId}/comments`, {
        content: replyContent,
        parentId: comment.commentId,
      });
      setReplyContent("");
      setIsReplying(false);
      setShowReplies(true);
      onRefresh();
    } catch (error) {
      console.error("답글 등록 실패", error);
      alert("답글 등록에 실패했습니다.");
    }
  };

  const handleDelete = async () => {
    if (window.confirm("정말 삭제하시겠습니까?")) {
      try {
        await apiDelete(`/boards/${boardId}/comments/${comment.commentId}`);
        onRefresh();
      } catch (error) {
        console.error("삭제 실패", error);
        alert("삭제에 실패했습니다.");
      }
    }
  };

  return (
    <div className="comment-item-container" id={`comment-${comment.commentId}`}>
      {/* 댓글 본문 영역 */}
      <div className={`comment-card ${comment.deleted ? "deleted" : ""}`}>
        {/* 1. 작성자 정보 (왼쪽) */}
        <div className="comment-header">
          <span className="comment-author">{comment.nickname}</span>
        </div>

        {/* 2. 댓글 내용 (가운데 - 남은 공간 차지) */}
        <p className="comment-content">
          {comment.deleted ? "삭제된 댓글입니다." : comment.content}
        </p>

        {/* 3. 메타 정보 (오른쪽: 날짜 + 버튼 묶음) */}
        <div className="comment-meta">
          <span className="comment-date">
            {new Date(comment.inputDate).toLocaleDateString()}{" "}
            {new Date(comment.inputDate).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>

          {/* 액션 버튼 (삭제된 댓글이 아닐 때만 노출) */}
          {!comment.deleted && (
            <div className="comment-actions">
              <button
                className="action-btn"
                onClick={() => setIsReplying(!isReplying)}
              >
                {isReplying ? "취소" : "답글"}
              </button>
              {comment.isAuthor && (
                <button className="action-btn delete" onClick={handleDelete}>
                  삭제
                </button>
              )}
              {/* 본인 댓글 아닐 때 신고 버튼 */}
              {!comment.isAuthor && onReport && (
                <button
                  className="action-btn report"
                  onClick={() =>
                    onReport("comment", comment.memberId, comment.commentId)
                  }
                >
                  신고
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 답글 보기/숨기기 토글 버튼 */}
      {comment.children && comment.children.length > 0 && (
        <button
          className="view-replies-btn"
          onClick={() => setShowReplies(!showReplies)}
        >
          {showReplies
            ? "▲ 답글 숨기기"
            : `▼ 답글 ${comment.children.length}개 보기`}
        </button>
      )}

      {/* 답글 입력 폼 */}
      {isReplying && (
        <form onSubmit={handleReplySubmit} className="reply-form">
          <span className="reply-arrow">↳</span>
          <input
            type="text"
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder={`${comment.nickname}님에게 답글 작성..`}
            className="reply-input"
            autoFocus
          />
          <button type="submit" className="reply-submit-btn">
            등록
          </button>
        </form>
      )}

      {/* 자식 댓글 재귀 렌더링 */}
      {showReplies && comment.children && comment.children.length > 0 && (
        <div className="replies-container">
          {comment.children.map((child) => (
            <CommentItem
              key={child.commentId}
              comment={child}
              boardId={boardId}
              onRefresh={onRefresh}
              onReport={onReport}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentItem;
