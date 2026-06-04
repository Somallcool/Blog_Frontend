import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { api, apiGet, apiPatch, apiPostJson } from "../../services/api";
import "./Mypage.css";

const MYPAGE_API_URL =
  "https://backward-plaster-pleading.ngrok-free.dev/api/v1/mypage";

//비밀번호 번경 섹션
function PasswordChange({ onSuccess }) {
  const [form, setForm] = useState({
    newPw: "",
    newPwConfirm: "",
  });
  const [message, setMessage] = useState(null); // {type: 'success' | 'error', text}

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPw !== form.newPwConfirm) {
      setMessage({
        type: "error",
        text: "새 비밀번호와 비밀번호 확인이 일치하지 않습니다.",
      });
      return;
    }

    try {
      await apiPatch("/mypage/password", form);
      setMessage({ type: "success", text: "비밀번호가 변경되었습니다." });
      setForm({ newPw: "", newPwConfirm: "" });
      setTimeout(() => onSuccess(), 1500);
    } catch (error) {
      const msg = error?.message?.includes("403")
        ? error.message.split(" - ")[1]
        : error.message || "비밀번호 변경에 실패했습니다.";
      setMessage({
        type: "error",
        text: msg || "비밀번호 변경에 실패했습니다.",
      });
    }
  };
  return (
    <div className="content-panel">
      <h3 className="panel-title">비밀번호 변경</h3>
      <p className="panel-desc">새 비밀번호를 입력해주세요.</p>
      {message && (
        <div className={`feedback-msg ${message.type}`}>{message.text}</div>
      )}
      <form onSubmit={handleSubmit} className="mypage-form">
        <div className="form-field">
          <label>새 비밀번호</label>
          <input
            type="password"
            name="newPw"
            value={form.newPw}
            onChange={handleChange}
            placeholder="대문자, 특수문자 포함 8자 이상"
            required
          />
        </div>
        <div className="form-field">
          <label>새 비밀번호 확인</label>
          <input
            type="password"
            name="newPwConfirm"
            value={form.newPwConfirm}
            onChange={handleChange}
            placeholder="새 비밀번호 재입력"
            required
          />
          {form.newPwConfirm && form.newPw !== form.newPwConfirm && (
            <span className="field-error">비밀번호가 일치하지 않습니다.</span>
          )}
        </div>
        <button type="submit" className="submit-btn">
          변경하기
        </button>
      </form>
    </div>
  );
}

//닉네임 변경 섹션
function NicknameChange(onSuccess) {
  const { user, setUser } = useAuth();
  const [nickname, setNickname] = useState("");
  const [checked, setChecked] = useState(false);
  const [message, setMessage] = useState(null);
  const [checkMsg, setCheckMsg] = useState(null);

  const handleNicknameChange = (e) => {
    setNickname(e.target.value);
    setChecked(false);
    setCheckMsg(null);
  };

  const handleCheck = async () => {
    if (!nickname.trim()) return;
    try {
      await apiPostJson(`/check/nickname`, { nick: nickname });
      setCheckMsg({ type: "success", text: "사용 가능한 닉네임입니다." });
      setChecked(true);
    } catch (error) {
      setCheckMsg({
        type: "error",
        text: "이미 사용중인 닉네임입니다.",
      });
      setChecked(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!checked) {
      setMessage({ type: "error", text: "닉네임 중복 확인을 먼저 해주세요" });
      return;
    }
    try {
      await apiPatch("/mypage/nickname", { nickname });
      setUser((prev) => ({ ...prev, nickname }));
      sessionStorage.setItem("userNickname", nickname);
      setMessage({ type: "success", text: "닉네임이 변경되었습니다." });
      setNickname("");
      setChecked(false);
      setCheckMsg(null);
      setTimeout(() => onSuccess(), 1500);
    } catch (e) {
      setMessage({
        type: "error",
        text: "닉네임 변경에 실패했습니다.",
      });
    }
  };

  return (
    <div className="content-panel">
      <h3 className="panel-title">닉네임 변경</h3>
      <p className="panel-desc">
        현재 닉네임 : <strong>{user?.nickname}</strong>
      </p>
      {message && (
        <div className={`feedback-msg ${message.type}`}>{message.text}</div>
      )}
      <form onSubmit={handleSubmit} className="mypage-form">
        <div className="form-field">
          <label>새 닉네임</label>
          <div className="input-with-btn">
            <input
              type="text"
              value={nickname}
              onChange={handleNicknameChange}
              placeholder="2~20자 입력"
              minLength={2}
              maxLength={20}
              required
            />
            <button type="button" className="check-btn" onClick={handleCheck}>
              중복확인
            </button>
          </div>
          {checkMsg && (
            <span className={`filed-msg ${checkMsg.type}`}>
              {checkMsg.text}
            </span>
          )}
        </div>
        <button type="submit" className="submit-btn" disabled={!checked}>
          변경하기
        </button>
      </form>
    </div>
  );
}

//내 게시글 목록 섹션
function MyBoards() {
  const navigate = useNavigate();
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet("/mypage/boards")
      .then(setBoards)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);
  if (loading)
    return (
      <div className="content-panel">
        <p className="empty-msg">불러오는 중...</p>
      </div>
    );
  return (
    <div className="content-panel">
      <h3 className="panel-title">나의 게시글</h3>
      <p className="panel-desc">게시글 목록</p>
      {boards.length === 0 ? (
        <p className="empty-msg">작성한 게시글이 없습니다.</p>
      ) : (
        <table className="boards-title">
          <thead>
            <tr>
              <th>제목</th>
              <th>카테고리</th>
              <th>조회수</th>
              <th>좋아요</th>
              <th>작성일</th>
            </tr>
          </thead>
          <tbody>
            {boards.map((b) => (
              <tr
                key={b.boardId}
                onClick={() => navigate(`/board/${b.boardId}`)}
                className="board-row"
              >
                <td className="board-title">{b.title}</td>
                <td>
                  <span className="category-badge">{b.category}</span>
                </td>
                <td>{b.views}</td>
                <td>{b.likes}</td>
                <td>{new Date(b.inputDate).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
// 회원 정보 섹션
function UserInfo({ userInfo }) {
  return (
    <div className="content-panel">
      <h3 className="panel-title">회원 정보</h3>
      <div className="info-list">
        <div className="info-row">
          <span className="info-label">아이디</span>
          <span>{userInfo.username}</span>
        </div>
        <div className="info-row">
          <span className="info-label">닉네임</span>
          <span>{userInfo.nickname}</span>
        </div>
      </div>
    </div>
  );
}

// 진입 비밀번호 확인 화면
function PasswordGate({ onVerrified }) {
  const [currentPw, setCurrentPw] = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiPostJson("/mypage/password/verify", { currentPw });
      onVerrified();
    } catch (error) {
      setError("비밀번호가 일치하지 않습니다.");
    }
  };

  return (
    <div className="password-gate-wrapper">
      <div className="password-gate">
        <div className="gate-icon">🔒</div>
        <h3 className="gate-title">본인 확인</h3>
        <p className="gate-desc">
          마이페이지에 접근하려면
          <br />
          현재 비밀번호를 입력해주세요.
        </p>
        {error && <div className="feedback-msg error">{error}</div>}
        <form onSubmit={handleSubmit} className="mypage-form">
          <div className="form-field">
            <input
              type="password"
              value={currentPw}
              onChange={(e) => {
                setCurrentPw(e.target.value);
                setError(null);
              }}
              placeholder="현재 비밀번호"
              autoFocus
              required
            />
          </div>
          <button type="submit" className="submit-btn">
            확인
          </button>
        </form>
      </div>
    </div>
  );
}

// 메인 mypage 컴포넌트
const MENU = [
  { id: "info", label: "회원 정보", group: null },
  { id: "password", label: "비밀번호 변경", group: "정보 수정" },
  { id: "nickname", label: "닉네임 변경", group: "정보 수정" },
  { id: "boards", label: "나의 게시물", group: null },
];

function Mypage() {
  const navigate = useNavigate();
  const [verified, setVerified] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState("info");
  // const [statusStyle, setStatusStyle] = useState({
  //   backgroundColor: "#fff3cd",
  //   color: "#856404",
  // });

  useEffect(() => {
    // loadMyPageData();
    apiGet("/mypage")
      .then(setUserInfo)
      .catch(() => navigate("/login"))
      .finally(() => setLoading(false));
  }, []);

  if (!loading && !verified) {
    return <PasswordGate onVerrified={() => setVerified(true)} />;
  }

  const renderContent = () => {
    if (loading || !userInfo)
      return (
        <div className="content-panel">
          <p className="empty-msg">불러오는 중...</p>
        </div>
      );
    switch (activeMenu) {
      case "info":
        return <UserInfo userInfo={userInfo} />;
      case "password":
        return <PasswordChange onSuccess={() => setActiveMenu("info")} />;
      case "nickname":
        return <NicknameChange onSuccess={() => setActiveMenu("info")} />;
      case "boards":
        return <MyBoards />;
      default:
        return null;
    }
  };

  //사이드바 그룹 렌더링
  const renderSidebar = () => {
    const grouped = [];
    let currentGroup = null;

    MENU.forEach((item) => {
      if (item.group && item.group !== currentGroup) {
        currentGroup = item.group;
        grouped.push({ type: "group", label: item.group });
      }
      grouped.push({ type: "item", ...item });
    });

    return grouped.map((node, i) => {
      if (node.type === "group") {
        return (
          <div key={`g-${i}`} className="sidebar-group-label">
            {node.label}
          </div>
        );
      }
      return (
        <button
          key={node.id}
          className={`sidebar-item ${node.group ? "sub-item" : ""} ${activeMenu === node.id ? "active" : ""}`}
          onClick={() => setActiveMenu(node.id)}
        >
          {node.label}
        </button>
      );
    });
  };

  return (
    <div className="mypage-wrapper">
      <aside className="mypage-sidebar">
        <div className="sidebar-header">마이페이지</div>
        {renderSidebar()}
      </aside>
      <main className="mypage-content">{renderContent()}</main>
    </div>
  );
}

export default Mypage;
