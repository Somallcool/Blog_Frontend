import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import "./SearchPage.css";

const PAGE_SIZE = 20;

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const keywordParam = searchParams.get("keyword");
  const tagParam = searchParams.get("tag");

  const [inputText, setInputText] = useState(keywordParam || "");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastBoardId, setLastBoardId] = useState(null);
  const [hasmore, setHasMore] = useState(false);

  // Intersection Observer target ref
  const sentineRef = useRef(null);

  //중복 fetch 방지용 ref
  const isFethcingRef = useRef(false);

  const handleSearch = (e) => {
    if (e.key === "Enter" && inputText.trim()) {
      const trimmedInput = inputText.trim();

      // 1. 입력값이 '#'으로 시작하는지 확인
      if (trimmedInput.startsWith("#")) {
        // '#' 제거하고 순수 태그명만 추출
        const tagName = trimmedInput.slice(1).trim();

        // 태그명이 비어있지 않다면 태그 검색으로 이동
        if (tagName) {
          navigate(`/search?tag=${encodeURIComponent(tagName)}`);
        }
      } else {
        // 2. '#'이 없으면 일반 키워드 검색 (글자 자르지 않음!)
        navigate(`/search?keyword=${encodeURIComponent(trimmedInput)}`);
      }
    }
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

  const fetchResults = useCallback(
    async (cursor = null, isAppend = false) => {
      if (!keywordParam && !tagParam) {
        setResults([]);
        return;
      }

      if (isFethcingRef.current) return;
      isFethcingRef.current = true;

      isAppend ? setLoadingMore(true) : setLoading(true);

      try {
        let url = `/api/v1/boards/search?size=${PAGE_SIZE}`;
        if (keywordParam) url += `&keyword=${encodeURIComponent(keywordParam)}`;
        if (tagParam) url += `&tagName=${encodeURIComponent(tagParam)}`;
        if (cursor) url += `&lastBoardId=${cursor}`;

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();

          setResults((prev) => {
            if (!isAppend) return data;
            //중복 boardId 제거 후 누적
            const existingIds = new Set(prev.map((b) => b.boardId));
            const deduplicated = data.filter(
              (b) => !existingIds.has(b.boardId),
            );
            return [...prev, ...deduplicated];
          });

          // 받은 데이터가 PAGE_SIZE개면 다음 페이지 있을 수 있음
          if (data.length == PAGE_SIZE) {
            setLastBoardId(data[data.length - 1].boardId);
            setHasMore(true);
          } else {
            setLastBoardId(null);
            setHasMore(false);
          }
        } else {
          if (!isAppend) setResults([]);
          setHasMore(false);
        }
      } catch (error) {
        console.error("검색 오류", error);
        if (!isAppend) setResults([]);
        setHasMore(false);
      } finally {
        isFethcingRef.current = false;
        isAppend ? setLoadingMore(false) : setLoading(false);
      }
    },
    [keywordParam, tagParam],
  );

  useEffect(() => {
    if (keywordParam) setInputText(keywordParam);
    else if (tagParam) setInputText(`#${tagParam}`);

    setResults([]);
    setLastBoardId(null);
    setHasMore(false);
    isFethcingRef.current = false;
    fetchResults(null, false);
  }, [keywordParam, tagParam]);

  // Intersection Observer : sentinel이 보이면 다음 페이지 로드
  useEffect(() => {
    if (!sentineRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasmore && !isFethcingRef.current) {
          fetchResults(lastBoardId, true);
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(sentineRef.current);
    return () => observer.disconnect();
  }, [hasmore, lastBoardId, fetchResults]);

  // useEffect(() => {
  //   const fetchSearchResults = async () => {
  //     if (!keywordParam && !tagParam) {
  //       setResults([]);
  //       return;
  //     }

  //     setLoading(true);
  //     try {
  //       let url = `""/api/v1/boards/search?`;
  //       if (keywordParam) url += `keyword=${encodeURIComponent(keywordParam)}`;
  //       if (tagParam) url += `tag=${encodeURIComponent(tagParam)}`;

  //       const response = await fetch(url);
  //       if (response.ok) {
  //         const data = await response.json();
  //         setResults(data);
  //       } else {
  //         setResults([]);
  //       }
  //     } catch (error) {
  //       console.error("검색 오류", error);
  //       setResults([]);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   if (keywordParam) setInputText(keywordParam);
  //   else if (tagParam) {
  //     setInputText(`#${tagParam}`);
  //   }
  //   fetchSearchResults();
  // }, [keywordParam, tagParam]);

  return (
    <div className="search-page-container">
      {/* 검색창 */}
      <div className="search-bar-wrapper">
        <div className="search-box">
          <span className="search-icon-large">🔍</span>
          <input
            type="text"
            placeholder="검색어를 입력하세요"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleSearch}
          />
        </div>
      </div>

      {/* 검색 결과 영역 */}
      <div className="search-results-area">
        {loading ? (
          <p className="status-msg">검색 중...</p>
        ) : (
          <>
            {/* 태그 검색일 경우 표시 */}
            {tagParam && <h3 className="tag-header"># {tagParam}</h3>}

            {/* 결과 목록 */}
            {results.length > 0 ? (
              <div className="result-list">
                <p className="result-count">
                  총 <b>{results.length}</b>개의 포스트를 찾았습니다.
                  {hasmore && " (더 있음)"}
                </p>

                {results.map((board) => (
                  <div key={board.boardId} className="result-item">
                    {/* 작성자 정보 */}
                    <div className="result-meta-top">
                      <span className="writer-name">{board.nickname}</span>
                    </div>
                    {/* 게시글 제목/ 내용 */}
                    <Link
                      to={`/board/${board.boardId}`}
                      className="result-link"
                    >
                      <h2>{board.title}</h2>
                    </Link>
                    <p className="result-summary">
                      {stripmarkdownAndHtml(board.contentSummary)}
                    </p>
                    {/* 하단 정보 (날짜,좋아요 등) */}
                    <div className="result-meta-bottom">
                      <span>
                        {new Date(board.inputDate).toLocaleDateString()}
                      </span>
                      <span className="separator">·</span>
                      <span>❤️ {board.likes}</span>
                    </div>
                  </div>
                ))}

                {/* 무한 스크롤 sentinel */}
                <div ref={sentineRef} style={{ height: "1px" }} />

                {/* 추가 로딩 스피너 */}
                {loadingMore && <p className="status-msg">불러오는 중...</p>}

                {/* 마지막 페이지 안내 */}
                {!hasmore && results.length > 0 && (
                  <p className="status-msg end-msg">
                    모든 결과를 불러왔습니다.
                  </p>
                )}
              </div>
            ) : (
              (keywordParam || tagParam) && (
                <p className="status-msg">검색 결과가 없습니다.</p>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
