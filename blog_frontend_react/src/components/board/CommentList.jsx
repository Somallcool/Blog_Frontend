import { useState, useEffect } from "react";
import { apiGet, apiPostJson } from "../../services/api";
import CommentItem from "./CommentItem";
import "./CommentList.css";

function CommentList({ boardId, onReportComment, onCommentsLoaded }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (boardId) {
      fetchComments();
    }
  }, [boardId]);

  const fetchComments = async () => {
    try {
      const data = await apiGet(`/boards/${boardId}/comments`);
      setComments(data);
      setTimeout(() => onCommentsLoaded?.(), 100);
    } catch (error) {
      console.error("댓글 로드 실패", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newComment.trim()) {
      alert("댓글 내용을 입력해주세요");
      return;
    }

    setLoading(true);
    try {
      const savedComment = await apiPostJson(`/boards/${boardId}/comments`, {
        content: newComment,
        parentId: null,
      });

      if (savedComment) {
        setComments((prevComments) => [savedComment, ...prevComments]);
      }
      setNewComment("");
    } catch (error) {
      console.error("댓글 작성 실패", error);
      alert("댓글 작성에 실패했습니다. (로그인 확인)");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="comment-section">
      <h3 className="comment-title">
        댓글 <span className="comment-count">{comments.length}</span>
      </h3>

      {/* 메인 댓글 작성 폼 (원글용) */}
      <form onSubmit={handleSubmit} className="comment-form">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="댓글을 작성하세요..."
          rows="3"
          maxLength="500"
        />
        <div className="form-footer">
          <span className="char-count">{newComment.length}/500</span>
          <button type="submit" disabled={loading}>
            {loading ? "작성 중..." : "댓글 작성"}
          </button>
        </div>
      </form>

      {/* 댓글 목록 렌더링 */}
      <div className="comment-list">
        {comments.length === 0 ? (
          <p className="no-comments">첫 댓글을 작성해보세요!</p>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.commentId}
              comment={comment}
              boardId={boardId}
              onRefresh={fetchComments}
              onReport={onReportComment}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default CommentList;
