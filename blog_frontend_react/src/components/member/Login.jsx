import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import "./Login.css";
import { authService } from "../../services/AuthService";
import kakaoLoginBtn from "../../assets/kakao_login_medium.png";

const API_BASE_URL = "http://localhost:8000/api/v1";
const KAKAO_AUTH_START_ENDPOINT = `${API_BASE_URL}/oauth/kakao/url`;
const NAVER_AUTH_START_ENDPOINT = `${API_BASE_URL}/oauth/naver/url`;

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusColor, setStatusColor] = useState("blue");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.username || !formData.password) {
      alert("아이디와 비밀번호를 입력해주세요");
      return;
    }
    setStatusMessage("로그인 시도 중...");
    setStatusColor("blue");
    setLoading(true);

    try {
      const finalUrl = `${API_BASE_URL}/login`;

      const response = await fetch(finalUrl, {
        method: "POST",
        headers: {
          "Content-type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      });
      if (response.ok) {
        const result = await response.json();

        sessionStorage.setItem("isLoggedIn", "true");
        sessionStorage.setItem("userNickname", result.nickname);

        login({ nickname: result.nickname, userRole: result.userRole }, null);

        setStatusMessage(
          `로그인 성공! ${result.nickname}님 환영합니다. 잠시 후 이동합니다.`,
        );
        setStatusColor("green");

        setTimeout(() => {
          navigate("/");
        }, 1500);
      } else {
        const errorData = await response.json().catch(() => null);
        const message =
          errorData?.message || "아이디 또는 비밀번호가 일치하지 않습니다.";
        setStatusMessage(message);
        setStatusColor("red");
      }
    } catch (error) {
      console.error("Fetch 통신 오류", error);
      setStatusMessage("네트워크 오류 : 백엔드 서버 실행 확인");
      setStatusColor("darkred");
    } finally {
      setLoading(false);
    }
  };

  const handleKakaoLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(KAKAO_AUTH_START_ENDPOINT);

      if (response.ok) {
        const result = await response.json();
        if (result && result.kakaoAuthUrl) {
          window.location.href = result.kakaoAuthUrl;
        } else {
          console.error("백엔드에서 유효한 카카오 인증 URL을 못 받음");
          alert("카카오 로그인 URL을 가져오는데 실패했습니다.");
        }
      } else {
        console.error(
          `카카오 로그인 시작 요청 실패 (상태 : ${response.status})`,
        );
        alert("카카오 로그인 요청에 실패했습니다.");
      }
    } catch (error) {
      console.error("네트워크 오류 & 백엔드 서버 접속 X :", error);
      alert("네트워크 오류가 발생했습니다.");
    }
  };

  const handleNaverLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(NAVER_AUTH_START_ENDPOINT);
      if (response.ok) {
        const result = await response.json();

        if (result && result.naverAuthUrl) {
          window.location.href = result.naverAuthUrl;
        } else {
          console.error("백엔드에서 유효한 네이버 인증 URL을 못 받음");
          alert("네이버 로그인 URL을 가져오는데 실패했습니다.");
        }
      } else {
        console.error(
          `네이버 로그인 시작 요청 실패 (상태 : ${response.status})`,
        );
        alert("네이버 로그인 요청에 실패했습니다.");
      }
    } catch (error) {
      console.error("네트워크 오류 + 백엔드 서버 접속 x : ", error);
      alert("네트워크 오류가 발생했습니다.");
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await authService.googleLogin();
    } catch (error) {
      console.error("구글 로그인 실패: ", error.message);
    }
  };

  return (
    <div className="login-container">
      <h1>로그인</h1>
      <div id="login-status">
        <form id="login-form" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="username">아이디</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="password">비밀번호</label>
            <input
              type="password"
              name="password"
              id="password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
            />
          </div>
          <div className="btn-wrapper">
            <button type="submit" disabled={loading}>
              {loading ? "로그인 중..." : "로그인"}
            </button>
          </div>
        </form>

        {/*상태 메세지 */}
        {statusMessage && (
          <div
            className="status-message"
            style={{ color: statusColor, marginTop: "1rem" }}
          >
            {statusMessage}
          </div>
        )}

        {/*소셜 로그인 영역 */}
        <div className="social-login-area">
          <a
            id="kakao-lolgin-btn"
            href="#"
            className="social-login-btn"
            onClick={handleKakaoLogin}
          >
            <img src={kakaoLoginBtn} alt="카카오 로그인 버튼" />
          </a>
          <a
            id="google-login-btn"
            href="#"
            className="social-login-btn"
            onClick={handleGoogleLogin}
          >
            <img
              src="https://developers.google.com/identity/images/g-logo.png"
              alt="구글 로그인 버튼"
            />
          </a>
        </div>
        {/*회원가입 링크 */}
        <div
          className="signup-link"
          style={{ marginTop: "1rem", textAlign: "center" }}
        >
          <span>계정이 없으신가요?</span>
          <Link to="/signup">회원가입</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
