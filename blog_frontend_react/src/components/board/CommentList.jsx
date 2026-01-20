import { useState, useEffect } from "react";
import { apiGet, apiPostJson, apiDelete, apiPut } from "../../services/api";
import "./CommentList.css";

function CommentList({ boardId }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (boardId) {
      fetchComments();
    }
  }, [boardId]);

  const fetchComments = async () => {
    try {
      const data = await apiGet(`/boards/${boardId}/comments`);

      const activeComments = data.filter((comment) => !comment.deleted);
      setComments(activeComments);
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
      });
      if (savedComment) {
        setComments((prevComments) => [savedComment, ...comments]);
      } else {
        await fetchComments();
      }
      setNewComment("");
    } catch (error) {
      console.error("댓글 작성 실패", error);
      alert("댓글 작성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditStart = (comment) => {
    setEditingId(comment.commentId);
    setEditContent(comment.content);
  };

  const handleEditSave = async (commentId) => {
    if (!editContent.trim()) {
      alert("댓글 내용을 입력해주세요");
      return;
    }
    try {
      await apiPut(`/boards/${boardId}/comments/${commentId}`, {
        content: editContent,
      });

      setEditContent("");
      setEditingId(null);
      fetchComments();
    } catch (error) {
      console.error("댓글 수정 실패", error);
      alert("댓글 수정에 실패했습니다.");
    }
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditContent("");
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm("댓글을 삭제하시겠습니까?")) {
      return;
    }

    try {
      await apiDelete(`/boards/${boardId}/comments/${commentId}`);
      fetchComments();
    } catch (error) {
      console.error("댓글 삭제 실패", error);
      alert("댓글 삭제에 실패했습니다.");
    }
  };

  const handleLike = async (commentId) => {
    try {
      const response = await apiPostJson(
        `/boards/${boardId}/comments/${commentId}/like`,
        {},
      );

      setComments(
        comments.map((comment) => {
          if (comment.commentId === commentId) {
            const isLiked =
              typeof response === "boolean"
                ? response
                : response.toLowerCase() === "true";

            return {
              ...comment,
              likes: isLiked
                ? comment.likes + 1
                : Math.max(0, comment.likes - 1),
              isLikedByCurrentUser: isLiked,
            };
          }
          return comment;
        }),
      );
    } catch (error) {
      console.error("좋아요 실패", error);
      alert("좋아요 실패했습니다.");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);
    const now = new Date();

    const diffMs = now - date;

    if (diffMs < 0) return "방금 전";

    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "방금 전";
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;

    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
  };

  return (
    <div className="comment-section">
      <h3 className="comment-title">
        댓글 <span className="comment-count">{comments.length}</span>
      </h3>

      {/* 댓글 작성 폼 */}
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

      {/* 댓글 목록 */}
      <div className="comment-list">
        {comments.length === 0 ? (
          <p className="no-comments">첫 댓글을 작성해보세요!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.commentId} className="comment-item">
              <div className="comment-header">
                <div className="comment-author">
                  <span className="author-name">{comment.nickname}</span>
                  <span className="comment-date">
                    {formatDate(comment.inputDate)}
                  </span>
                  {comment.modifiedDate && (
                    <span className="edited-label">(수정됨)</span>
                  )}
                </div>

                {comment.isAuthor && (
                  <div className="comment-actions">
                    {editingId === comment.commentId ? (
                      <>
                        <button
                          onClick={() => handleEditSave(comment.commentId)}
                          className="btn-save"
                        >
                          저장
                        </button>
                        <button
                          onClick={handleEditCancel}
                          className="btn-cancel"
                        >
                          취소
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEditStart(comment)}
                          className="btn-edit"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDelete(comment.commentId)}
                          className="btn-delete"
                        >
                          삭제
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="comment-content">
                {editingId === comment.commentId ? (
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows="3"
                    maxLength="500"
                    autoFocus
                  />
                ) : (
                  <p>{comment.content}</p>
                )}
              </div>

              <div className="comment-footer">
                <button
                  onClick={() => handleLike(comment.commentId)}
                  className={`like-button ${comment.isLikedByCurrentUser ? "liked" : ""}`}
                >
                  <span className="like-icon">
                    {comment.isLikedByCurrentUser ? "❤️" : "🤍"}
                  </span>
                  <span className="like-count">{comment.likes || 0}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default CommentList;
