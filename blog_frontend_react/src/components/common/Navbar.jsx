import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import "./Navbar.css";

const LOGOUT_API_URL = "http://localhost:8000/api/v1/logout";

function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const naviage = useNavigate();

  const handleLogout = async (event) => {
    event.preventDefault();

    try {
      await fetch(LOGOUT_API_URL, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("로그아웃 요청 중 오류 발생 : ", error);
    } finally {
      sessionStorage.removeItem("isLoggedIn");
      sessionStorage.removeItem("userNickname");
      localStorage.removeItem("jwtToken");
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("userNickname");

      logout();
      alert("로그아웃되었습니다.");
      naviage("/");
    }
  };
  return (
    <nav className="navbar">
      <div className="nav-content">
        <div className="nav-logo">
          <Link to="/">Semicolon</Link>
        </div>
        <ul className="nav-links">
          <li>
            <Link to="/">홈</Link>
          </li>

          {isAuthenticated && user?.nickname ? (
            <>
              {/*로그인 상태 */}
              <li className="user-greeting">
                <span>{user.nickname}님,반갑습니다.</span>
              </li>
              <li>
                <Link to="/mypage" id="mypage">
                  마이페이지
                </Link>
              </li>
              <li>
                <a href="#" onClick={handleLogout} id="logout-button">
                  로그아웃
                </a>
              </li>
            </>
          ) : (
            <>
              {/*로그아웃 상태 */}
              <li>
                <Link to="/signup">회원가입</Link>
              </li>
              <li>
                <Link to="/login">로그인</Link>
              </li>
            </>
          )}

          <li>
            <a href="#">문의</a>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
