import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api, apiGet } from "../../services/api";
import "./BoardList.css";

function BoardList() {
  const navigate = useNavigate();

  const [boards, setBoards] = useState([]);
  const [cursorId, setCursorId] = useState(null);
  const [cursorDate, setCursorDate] = useState(null);
  const [hasNext, setHasNext] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const pageSize = 10;
  const observerTarget = useRef(null);

  const fetchBoardList = useCallback(async () => {
    if (isLoading || !hasNext) return;

    setIsLoading(true);
    setError(null);

    try {
      let url = `/boards/cursor?size=${pageSize}`;
      if (cursorId !== null && cursorDate !== null) {
        url += `&cursorId=${cursorId}&cursorDate=${cursorDate}`;
      }

      const response = await apiGet(url);
      const newBoards = response.content;

      if (newBoards && newBoards.length > 0) {
        setBoards((prev) => {
          // 기존 데이터에 이미 존재하는 ID인지 확인하여 중복 방지
          const existingIds = new Set(prev.map((b) => b.boardId));
          const filteredNewBoards = newBoards.filter(
            (b) => !existingIds.has(b.boardId),
          );
          return [...prev, ...filteredNewBoards];
        });

        // 다음 페이지를 위한 커서 업데이트
        setHasNext(response.hasNext);
        setCursorId(response.nextCursorId);
        setCursorDate(response.nextCursorDate);
      } else {
        setHasNext(false); // 가져온 데이터가 없으면 끝으로 처리
      }
    } catch (error) {
      console.error("게시글 목록 조회 실패", error);
      setError(`API 요청 실패 : ${error.message}`);
      setHasNext(false);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasNext, cursorId, cursorDate]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNext && !isLoading) {
          fetchBoardList();
        }
      },
      { threshold: 0.1 },
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [fetchBoardList, hasNext, isLoading]);

  const handleCardClick = (boardId) => {
    navigate(`/board/${boardId}`);
  };

  const handleWriteClick = () => {
    navigate("/board/write");
  };

  const extractImage = (content) => {
    if (!content) return null;
    const imgMacth = content.match(
      /<img[^>]+src\s*=\s*['"]([^'"]+)['"][^>]*>/i,
    );
    return imgMacth && imgMacth[1] ? imgMacth[1] : null;
  };

  const getSummaryText = (board) => {
    let summaryText = board.contentSummary || "내용 요약이 없습니다.";

    if (!board.contentSummary && board.content) {
      const rawContent = board.content.replace(/<[^>]*>/g, "").trim();
      const singleLineContent = rawContent.replace(/(\r\n|\n|\r)/gm, " ");
      summaryText =
        singleLineContent.substring(0, 150) +
        (singleLineContent.length > 150 ? "..." : "");
    }
    return summaryText;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}년 ${
      date.getMonth() + 1
    }월 ${date.getDate()}일`;
  };
  const stripmarkdownAndHtml = (text) => {
    if (!text) return "";
    let cleanText = text
      .replace(/<[^>]*>/g, "")
      .replace(/!\[.*\]\(.*\)/g, "")
      .replace(/\[.*\]\(.*\)/g, "")
      .replace(/[#*|>_`-]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    return cleanText;
  };
  return (
    <div className="board-list-page">
      <div className="container-velog">
        {/* 헤더 */}
        <header className="board-header">
          <h1>최신 포스트</h1>
          <button className="write-button" onClick={handleWriteClick}>
            새 글 작성
          </button>
        </header>

        {/* 게시글 목록 */}
        <main className="board-main">
          <div className="board-grid">
            {boards.length === 0 && !isLoading ? (
              <p className="empty-message">등록된 게시글이 없습니다.</p>
            ) : (
              boards.map((board) => {
                const imageUrl = extractImage(board.content);
                const summaryText = getSummaryText(board);

                return (
                  <div
                    key={board.boardId}
                    className="board-card"
                    onClick={() => handleCardClick(board.boardId)}
                  >
                    {/* 이미지 */}
                    {imageUrl && (
                      <div className="card-image">
                        <img
                          src={imageUrl}
                          alt={`${board.title} 대표 이미지`}
                        />
                      </div>
                    )}

                    {/* 내용 */}
                    <div className="card-content">
                      <h2 className="card-title">{board.title}</h2>
                      <p className="card-summary">
                        {stripmarkdownAndHtml(summaryText)}
                      </p>

                      {/* 메타 정보 */}
                      <div className="card-meta">
                        <div className="meta-left">
                          <span>{formatDate(board.inputDate)}</span>
                          <span>
                            by <span className="author">{board.nickname}</span>
                          </span>
                        </div>

                        <div className="meta-right">
                          {/* 조회수 */}
                          <span className="meta-item">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                              <path
                                fillRule="evenodd"
                                d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                            {board.views || 0}
                          </span>

                          {/* 좋아요 */}
                          <span className="meta-item">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                                clipRule="evenodd"
                              />
                            </svg>
                            {board.likes || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {/* 로딩 메시지 */}
          {isLoading && (
            <div className="loading-message">
              <div className="spinner"></div>
              <p>게시글을 불러오는 중...</p>
            </div>
          )}

          {/* 에러 메시지 */}
          {error && <div className="error-message">{error}</div>}

          {/* 목록 끝 메시지 */}
          {!hasNext && boards.length > 0 && (
            <div className="end-message">
              <p>- 모든 게시글을 불러왔습니다 -</p>
            </div>
          )}

          {/* Intersection Observer 타겟 */}
          <div ref={observerTarget} style={{ height: "20px" }} />
        </main>
      </div>
    </div>
  );
}

export default BoardList;
