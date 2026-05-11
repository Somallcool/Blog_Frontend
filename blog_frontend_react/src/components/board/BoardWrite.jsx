import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { apiGet, apiPost, apiPut, apiPostJson } from "../../services/api";
import "./BoardWrite.css";
import TagInput from "./TagInput";
import { useAuth } from "../../contexts/AuthContext";

const allowedTypes = ["image/jpeg", "image/png", "image/gif", "/image/webp"];

function BoardWrite() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    title: "",
    nickname: "",
    category: "",
    content: "",
  });

  const [tags, setTags] = useState([]);

  const [preview, setPreview] = useState(
    '<p class="text-gray-400 italic">여기에 마크다운 미리보기가 표시됩니다.</p>',
  );
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState("error");
  const [isDragging, setIsDragging] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [boardId, setBoardId] = useState(null);

  const contentRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get("id");

    if (id) {
      setIsEditMode(true);
      setBoardId(id);
      loadBoardData(id);
    }
  }, [location]);

  useEffect(() => {
    // initializeAuth();
    if (user?.nickname) {
      setFormData((prev) => ({ ...prev, nickname: user.nickname }));
    }
  }, [user]);

  const showMessage = (message, type = "error") => {
    setStatusMessage(message);
    setStatusType(type);

    setTimeout(() => {
      setStatusMessage("");
    }, 3000);
  };

  // const initializeAuth = async () => {
  //   try {
  //     const authResponse = await apiGet("/boards/auth-check");
  //     const nickname = authResponse.userNickname;

  //     if (!nickname) {
  //       throw new Error("닉네임 정보 누락");
  //     }
  //     setFormData((prev) => ({ ...prev, nickname }));

  //     sessionStorage.setItem("isLoggedIn", "true");
  //     sessionStorage.setItem("userNickname", nickname);
  //   } catch (error) {
  //     console.error(
  //       "인증 확인 실패. 로그인 페이지로 이동합니다.",
  //       error.message,
  //     );
  //     alert("게시글 작성을 위해 로그인이 필요합니다.");
  //     navigate("/login");
  //   }
  // };

  const loadBoardData = async (id) => {
    try {
      const article = await apiGet(`/boards/${id}`);
      console.log(article);
      console.log(article.tags);
      setFormData({
        title: article.title || "",
        nickname: article.nickname || "",
        category: article.category || "free",
        content: article.content || "",
      });

      setTags(article.tags || []);

      updatePreview(article.content || "");
    } catch (error) {
      console.error("수정할 게시글 데이터 로드 실패", error);
      showMessage(
        "게시글 정보를 불러오는데 실패했습니다. 목록으로 돌아갑니다.",
        "error",
      );

      setTimeout(() => {
        navigate("/");
      }, 3000);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "content") {
      updatePreview(value);
    }
  };

  const updatePreview = async (markdownText) => {
    if (!markdownText.trim()) {
      setPreview(
        '<p class="text-gray-400 italic">여기에 마크다운 미리보기가 표시됩니다.</p>',
      );
      return;
    }

    try {
      const htmlContent = await apiPostJson("/boards/markdown-preview", {
        markdownText,
      });
      setPreview(htmlContent);
    } catch (error) {
      console.error("마크다운 미리보기 실패", error);
      setPreview(
        '<p class="text-red-500">미리보기 로딩 중 오류가 발생했습니다.</p>',
      );
    }
  };

  const uploadImageToServer = async (file) => {
    console.log(
      `[Server Upload Processing] 파일명 : ${file.name}, 타입 : ${file.type}`,
    );

    const formDataUpload = new FormData();
    formDataUpload.append("file", file);

    try {
      const serverUrl = await apiPost("/boards/upload-image", formDataUpload);
      console.log(`[Upload Success] 서버 URL : ${serverUrl}`);
      return serverUrl;
    } catch (error) {
      console.error("파일 서버 업로드 실패 : ", error);
      throw new Error(`파일 업로드 실패 : ${error.message || "서버 오류"}`);
    }
  };

  const updateTextareaContent = (
    text,
    updateAction = "insert",
    targetText = "",
  ) => {
    const textarea = contentRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    let value = formData.content;
    let newCursorPos = start + text.length;

    if (updateAction === "insert") {
      value = value.substring(0, start) + text + value.substring(end);
    } else if (updateAction === "replace" && targetText) {
      const startIndex = value.indexOf(targetText);
      if (startIndex !== -1) {
        value =
          value.substring(0, startIndex) +
          text +
          value.substring(startIndex + targetText.length);
        newCursorPos = startIndex + text.length;
      } else {
        value = value.substring(0, start) + text + value.substring(end);
        newCursorPos = start + text.length;
      }
    }

    setFormData((prev) => ({ ...prev, content: value }));
    updatePreview(value);

    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = newCursorPos;
      textarea.focus();
    }, 10);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
    e.dataTransfer.dropEffect = "copy";
  };
  const handleDragleave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    const imageFile = files[0];

    if (!allowedTypes.includes(imageFile.type)) {
      showMessage(
        `[${imageFile.type}]은 지원하지 않는 파일 형식입니다. (JPG, PNG 등만 허용)`,
      );
      return;
    }

    const loadingText = `\n[이미지 ${imageFile.name} 업로드 중... ⏳]\n`;
    updateTextareaContent(loadingText, "insert");

    try {
      const imageUrl = await uploadImageToServer(imageFile);
      const markdownSyntax = `\n![${imageFile.name}](${imageUrl})\n`;

      console.log("마크다운 삽입 :", markdownSyntax);
      console.log("로딩 텍스트 :", loadingText);

      updateTextareaContent(markdownSyntax, "replace", loadingText);
    } catch (error) {
      console.error("이미지 처리 실패 : ", error);
      showMessage(`이미지 처리 실패 :${error.message} `, error);

      const errorMarkdown = `\n[이미지 ${imageFile.name} 처리 실패: 서버 오류]\n`;
      updateTextareaContent(errorMarkdown, "replace", loadingText);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.content) {
      showMessage("제목과 내용을 모두 입력해주세요");
      return;
    }

    const data = {
      title: formData.title,
      nickname: formData.nickname,
      category: formData.category,
      content: formData.content,
      tags: tags,
    };

    try {
      if (isEditMode) {
        await apiPut(`/boards/${boardId}`, data);
        showMessage("게시글 수정이 완료되었습니다.", "success");

        setTimeout(() => {
          navigate(`/board/${boardId}`);
        }, 800);
      } else {
        await apiPostJson("/boards", data);
        showMessage("게시글 작성이 완료되었습니다.", "success");

        setTimeout(() => {
          navigate("/");
        }, 800);
      }
    } catch (error) {
      console.error("폼 제출 실패 : ", error);
      showMessage(
        `게시글 ${isEditMode ? "수정" : "작성"} 중 오류가 발생했습니다: ${
          error.message
        }`,
        "error",
      );
    }
  };

  return (
    <div className="board-write-page">
      <div className="write-container">
        <h1 className="page-title">
          {isEditMode ? "게시글 수정" : "새 게시글 작성"}
        </h1>

        {/* 상태 메시지 */}
        {statusMessage && (
          <p className={`status-message ${statusType}`}>{statusMessage}</p>
        )}

        <form onSubmit={handleSubmit}>
          {/* 제목 */}
          <div className="form-group">
            <label htmlFor="title">제목</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="제목을 입력하세요"
              required
            />
          </div>

          {/* 작성자 (닉네임) */}
          <div className="form-group">
            <label htmlFor="nickname">작성자 (닉네임)</label>
            <input
              type="text"
              id="nickname"
              name="nickname"
              value={formData.nickname}
              readOnly
              className="readonly-input"
            />
          </div>

          {/* 카테고리 */}
          <div className="form-group">
            <label htmlFor="category">카테고리</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="" disabled>
                카테고리를 선택하세요
              </option>
              <option value="notice">공지사항</option>
              <option value="free">자유 게시판</option>
              <option value="question">질문/답변</option>
              <option value="etc">기타</option>
            </select>
          </div>

          <div className=" form-group">
            <label>태그</label>
            <TagInput tags={tags} setTags={setTags} />
          </div>
          {/* 내용 (마크다운) */}
          <div className="form-group">
            <label htmlFor="content">
              내용 (마크다운) - 이미지 드래그 가능
            </label>
            <textarea
              ref={contentRef}
              id="content"
              name="content"
              rows="10"
              value={formData.content}
              onChange={handleChange}
              onDragOver={handleDragOver}
              onDragLeave={handleDragleave}
              onDrop={handleDrop}
              className={isDragging ? "drag-hover" : ""}
              placeholder="마크다운 문법으로 내용을 작성하고 이미지를 드래그하세요."
              required
            />
          </div>

          {/* 마크다운 미리보기 */}
          <h2 className="preview-title">미리보기</h2>
          <div
            className="markdown-preview"
            dangerouslySetInnerHTML={{ __html: preview }}
          />

          {/* 버튼 그룹 */}
          <div className="button-group">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="cancel-button"
            >
              취소
            </button>
            <button
              type="submit"
              className={isEditMode ? "submit-button edit" : "submit-button"}
            >
              {isEditMode ? "수정 완료" : "게시글 작성"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BoardWrite;
