import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Mypage.css";

const MYPAGE_API_URL = "http://localhost:8000/api/v1/mypage";

function Mypage() {
  const navigate = useNavigate();

  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("데이터 로드 중...");
  const [statusStyle, setStatusStyle] = useState({
    backgroundColor: "#fff3cd",
    color: "#856404",
  });

  useEffect(() => {
    loadMyPageData();
  }, []);

  const loadMyPageData = async () => {
    setStatusMessage("인증 정보를 확인 중입니다.");
    setStatusStyle({
      backgroundColor: "#d1ecf1",
      color: "#0c5460",
    });

    // const token =
    //   sessionStorage.getItem("jwtToken") || localStorage.getItem("jwtToken");

    try {
      const response = await fetch(MYPAGE_API_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setUserInfo(data);
        setLoading(false);
      } else if (response.status === 401) {
        setStatusMessage(
          "로그인 세션이 만료되었거나 로그인되어 있지 않습니다. 로그인 페이지로 이동합니다.",
        );
        setStatusStyle({
          backgroundColor: "#f8d7da",
          color: "#721c24",
        });

        setTimeout(() => {
          navigate("/login");
        }, 1500);
      } else {
        const errorData = await response.json().catch(() => ({
          message: `상태코드 ${response.status} 오류`,
        }));

        setStatusMessage(
          `오류 발생 :${
            errorData.message || "사용자 정보를 불러올 수 없습니다."
          }`,
        );
        setStatusStyle({
          backgroundColor: "#f8d7da",
          color: "#721c24",
        });
        setLoading(false);
      }
    } catch (error) {
      console.error("API 호출 중 오류 ", error);
      setStatusMessage("네트워크 오류 : 백엔드 서버 연결 확인");
      setStatusStyle({
        backgroundColor: "#f8d7da",
        color: "#721c24",
      });
      setLoading(false);
    }
  };

  const handleEdit = () => {
    alert("정보 수정 기능은 준비 중입니다.");
  };

  return (
    <div className="mypage-container">
      <h2>마이페이지</h2>

      {loading || !userInfo ? (
        <div className="message" style={statusStyle}>
          {statusMessage}
        </div>
      ) : (
        <section className="user-info-section">
          <h3>회원 정보</h3>
          <div className="info-group">
            <label>회원 번호 (ID):</label>
            <p>{userInfo.memberId}</p>
          </div>

          <div className="info-group">
            <label>아이디 (username):</label>
            <p>{userInfo.username}</p>
          </div>

          <div className="info-group">
            <label>닉네임 (nickname):</label>
            <p>{userInfo.nickname}</p>
          </div>

          <div className="info-group">
            <label>이메일 (email):</label>
            <p>{userInfo.email}</p>
          </div>

          <button className="primary-btn" onClick={handleEdit}>
            정보 수정
          </button>
        </section>
      )}
    </div>
  );
}

export default Mypage;
