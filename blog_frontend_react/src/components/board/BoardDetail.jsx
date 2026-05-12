import { useState, useEffect } from "react";
import { apiDelete, apiGet, apiPost } from "../../services/api";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  checkSubscription,
  toggleSubscription,
} from "../../services/subscriptionApi";
import "./BoardDetail.css";
import CommentList from "./CommentList.jsx";

function BoardDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [isStatusError, setIsStatusError] = useState(false);

  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (id) {
      fetchBoardDetail(id);
    }
  }, [id]);

  const showStatusMessage = (message, isError = false) => {
    setStatusMessage(message);
    setIsStatusError(isError);

    setTimeout(() => {
      setStatusMessage("");
    }, 3000);
  };

  const fetchBoardDetail = async (boardId) => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiGet(`/boards/${boardId}`);

      if (data && data.boardId) {
        setBoard(data);

        const writerId = data.member?.memberId || data.memberId;
        if (writerId && !data.isAuthor) {
          checkSubscribeStatus(writerId);
        }
      } else {
        throw new Error("조회된 게시글 데이터가 유효하지 않습니다.");
      }
    } catch (error) {
      const status = error.status || "Unknown";
      const message = error.message || "서버 응답 오류";

      console.error("API GET 요청 실패 :", error);
      setError(
        `게시글을 불러오는 데 실패했습니다.(상태코드: ${status}, 메세지 : ${message})`,
      );
    } finally {
      setLoading(false);
    }
  };

  const checkSubscribeStatus = async (targetId) => {
    const status = await checkSubscription(targetId);
    setIsSubscribed(status);
  };

  const handleSubscribeClick = async () => {
    const writerId = board?.member?.memberId || board?.memberId;
    if (!writerId) {
      showStatusMessage("작성자 정보를 찾을 수 없습니다.", true);
      return;
    }
    try {
      const newState = await toggleSubscription(writerId);
      setIsSubscribed(newState);
      showStatusMessage(newState ? "구독했습니다." : "구독을 취소했습니다.");
    } catch (error) {
      console.error("구독 토글 실패", error);
      if (error.response?.status == 401) {
        alert("로그인이 필요한 서비스입니다.");
        navigate("/login");
      } else {
        showStatusMessage("구독 처리에 실패했습니다.", true);
      }
    }
  };

  const handleLikeClick = async () => {
    if (!id) {
      showStatusMessage("게시글 Id를 찾을 수 없습니다.", true);
      return;
    }
    try {
      let isLikedResponse = await apiPost(`/boards/${id}/like`, {});
      let isLiked;
      if (typeof isLikedResponse === "string") {
        isLiked = isLikedResponse.toLowerCase() === "true";
      } else if (typeof isLikedResponse === "boolean") {
        isLiked = isLikedResponse;
      } else {
        console.error("좋아요 토글 응답이 유효하지 않습니다.", isLikedResponse);
        setStatusMessage("좋아요 처리 응답 오류", true);
        return;
      }

      const currentLikeCount = board.likes || 0;
      const newLikeCount = isLiked
        ? currentLikeCount + 1
        : Math.max(0, currentLikeCount - 1);

      setBoard((prev) => ({
        ...prev,
        likes: newLikeCount,
        isLikedByCurrentUser: isLiked,
      }));

      const message = isLiked
        ? "좋아요를 눌렀습니다."
        : "좋아요를 취소했습니다.";
      showStatusMessage(message);
    } catch (error) {
      console.error("좋아요 토글 실패:", error);
      showStatusMessage(`좋아요 실패 ${error.message || "서버 오류"} `, true);
    }
  };

  const handleDelete = async () => {
    if (!id) {
      showStatusMessage("삭제할 게시글 Id를 찾을 수 없습니다.", true);
      return;
    }
    if (!window.confirm("정말 삭제하시겠습니까?")) {
      return;
    }
    try {
      await apiDelete(`/boards/${id}`);
      showStatusMessage("게시글이 설공적으로 삭제되었습니다.");

      setTimeout(() => {
        navigate("/");
      }, 800);
    } catch (error) {
      const errorMessage =
        error.status === 403
          ? "권한이 없습니다. 작성자만 삭제할 수 있습니다."
          : error.message || "서버 오류";
      console.error("게시글 삭제 실패", error);
      showStatusMessage(`게시글 삭제 실패 : ${errorMessage}`, true);
    }
  };

  const handleEdit = () => {
    if (id) {
      navigate(`/board/write?id=${id}`);
    }
  };

  const handleBack = () => {
    navigate("/");
  };

  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0 || bytes === null) return "0 bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + "" + sizes[i];
  };

  if (loading) {
    return (
      <div className="board-detail-page">
        <div className="detail-container">
          <div className="loading-message">게시글 불러오는 중...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="board-detail-page">
        <div className="detail-container">
          <div className="error-message">{error}</div>
          <button onClick={handleBack} className="back-button">
            목록으로
          </button>
        </div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="board-detail-page">
        <div className="detail-container">
          <div className="error-message">게시글을 찾을 수 없습니다.</div>
          <button onClick={handleBack} className="back-button">
            목록으로
          </button>
        </div>
      </div>
    );
  }

  const isImage =
    board.filePath &&
    board.fileOriginalName &&
    ["jpg", "jpeg", "png", "gif", "webp"].includes(
      board.fileOriginalName.split(".").pop().toLowerCase(),
    );
  const formatDate = (dateString) => {
    if (!dateString) return "";
    return dateString.substring(2, 10);
  };
  return (
    <div className="board-detail-page">
      <div className="detail-container">
        {/* 제목 */}
        <div className="title-section">
          <h2>{board.title || "제목 없음"}</h2>
        </div>

        {/* 메타 정보 */}
        <div className="meta-section">
          <div className="meta-left">
            <span>
              작성자: <strong>{board.member?.nickname || "익명"}</strong>
              {/* 구독 버튼 */}
              {!board.isAuthor && (
                <button
                  onClick={handleSubscribeClick}
                  className={`subscribe-btn ${isSubscribed ? "active" : ""}`}
                >
                  {isSubscribed ? "구독 중" : "구독 +"}
                </button>
              )}
            </span>
            <span>작성일: {formatDate(board.inputDate) || "N/A"}</span>
          </div>

          <div className="meta-right">
            <span>
              조회수: <strong>{board.views || 0}</strong>
            </span>

            {/* 좋아요 버튼 */}
            <button
              onClick={handleLikeClick}
              className={`like-button ${
                board.isLikedByCurrentUser ? "liked" : ""
              }`}
            >
              <span className="like-icon">
                {board.isLikedByCurrentUser ? "❤️" : "🤍"}
              </span>
              <span>좋아요: </span>
              <strong>{board.likes || 0}</strong>
            </button>

            {/* 상태 메시지 */}
            {statusMessage && (
              <span
                className={`status-message ${
                  isStatusError ? "error" : "success"
                }`}
              >
                {statusMessage}
              </span>
            )}
          </div>
        </div>

        {/* 내용 */}
        <div className="content-section">
          <div
            className="prose"
            dangerouslySetInnerHTML={{
              __html: board.content || '<p class="text-gray-400">내용 없음</p>',
            }}
          />
        </div>
        {/* 태그 영역 */}
        {board.tags && board.tags.length > 0 && (
          <div className="board-tags-container">
            {board.tags.map((tag, index) => (
              <Link to={`/search?tag=${tag}`} key={index} className="tag-badge">
                #{tag}
              </Link>
            ))}
          </div>
        )}
        {/* 첨부 이미지 */}
        {isImage && (
          <div className="image-section">
            <h3>첨부 이미지 미리보기</h3>
            <img
              src={board.filePath}
              alt={board.fileOriginalName}
              className="board-image"
            />
          </div>
        )}

        {/* 첨부 파일 정보 */}
        {board.filePath && board.fileOriginalName && (
          <div className="file-section">
            <span className="file-label">첨부 파일:</span>
            <a
              href={board.filePath}
              target="_blank"
              rel="noopener noreferrer"
              className="file-link"
            >
              {board.fileOriginalName}
              <span className="file-size">({formatBytes(board.fileSize)})</span>
            </a>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="action-buttons">
          {board.isAuthor && (
            <>
              <button onClick={handleEdit} className="edit-button">
                수정
              </button>
              <button onClick={handleDelete} className="delete-button">
                삭제
              </button>
            </>
          )}
          <button onClick={handleBack} className="back-button">
            목록으로
          </button>
        </div>
        {/* 댓글 컴포넌트 추가 */}
        <CommentList boardId={id} />
      </div>
    </div>
  );
}

export default BoardDetail;
