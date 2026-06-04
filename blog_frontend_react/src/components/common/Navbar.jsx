import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import NotificationBell from "./NotificationBell";
import "./Navbar.css";
import { useRef, useState } from "react";

const LOGOUT_API_URL = "/api/v1/logout";

function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigage = useNavigate();

  const handleSearch = (e) => {
    if (e.key == "Enter" && searchKeyword.trim()) {
      navigage(`/search?keyword=${searchKeyword}`);
      setSearchKeyword("");
    }
  };

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
      navigage("/");
    }
  };

  const handleGuestBellClick = (e) => {
    e.stopPropagation();

    alert("로그인이 필요한 서비스입니다.");
    navigage("/login");
  };
  return (
    <nav className="navbar">
      <div className="nav-content">
        <div className="nav-logo">
          <Link to="/">Semicolon</Link>
        </div>
        <ul className="nav-links">
          {/* <li>
            <Link to="/">홈</Link>
          </li> */}

          <ul className="nav-links">
            <li>
              <Link to="/search" className="search-icon-link">
                🔍
              </Link>
            </li>
          </ul>

          {isAuthenticated && user?.nickname ? (
            <>
              {/* 알림 벨 추가 */}
              <li style={{ display: "flex", alignItems: "center" }}>
                <NotificationBell />
              </li>
              {/*로그인 상태 */}
              <li className="user-greeting">
                <span>{user.nickname}님,반갑습니다.</span>
              </li>
              {/* 어드민 전용 */}
              {user?.role === "ROLE_ADMIN" && (
                <li>
                  <Link to="/admin/reports" id="admin-reports">
                    신고 관리
                  </Link>
                </li>
              )}

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
              <li style={{ display: "flex", alignItems: "center" }}>
                <div
                  onClickCapture={handleGuestBellClick}
                  style={{ cursor: "pointer", display: "flex" }}
                >
                  <NotificationBell />
                </div>
              </li>
              {/*로그아웃 상태 */}
              {/* <li>
                <Link to="/signup">회원가입</Link>
              </li> */}

              <li>
                <Link to="/login">로그인</Link>
              </li>
            </>
          )}

          {/* <li>
            <a href="#">문의</a>
          </li> */}
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
