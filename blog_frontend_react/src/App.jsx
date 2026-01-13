// src/App.jsx
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Navbar from "./components/common/Navbar.jsx";
import Login from "./components/member/Login.jsx";
import Signup from "./components/member/Signup.jsx";
import "./App.css";

function Home() {
  return (
    <div style={{ padding: "2rem" }}>
      <h1>홈 페이지</h1>
    </div>
  );
}

function Mypage() {
  return (
    <div style={{ padding: "2rem" }}>
      <h1>마이페이지</h1>
    </div>
  );
}

function BoardList() {
  return (
    <div style={{ padding: "2rem" }}>
      <h1>게시판 목록</h1>
    </div>
  );
}

function BoardDetail() {
  return (
    <div style={{ padding: "2rem" }}>
      <h1>게시글 상세</h1>
    </div>
  );
}

function BoardWrite() {
  return (
    <div style={{ padding: "2rem" }}>
      <h1>글쓰기</h1>
    </div>
  );
}

// 인증이 필요한 라우트 보호 컴포넌트
function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
}

// URL에서 토큰 처리하는 컴포넌트
function TokenHandler() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const jwtToken = urlParams.get("token");
    const userNickname = urlParams.get("nickname");

    if (jwtToken && userNickname) {
      sessionStorage.setItem("jwtToken", jwtToken);
      sessionStorage.setItem("isLoggedIn", "true");
      sessionStorage.setItem("userNickname", userNickname);

      login({ nickname: userNickname }, jwtToken);
      navigate(location.pathname, { replace: true });
    }
  }, [location, login, navigate]);

  return null;
}

function AppContent() {
  return (
    <div className="App">
      <Navbar />
      <TokenHandler />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/mypage"
            element={
              <PrivateRoute>
                <Mypage />
              </PrivateRoute>
            }
          />
          <Route path="/board" element={<BoardList />} />
          <Route path="/board/:id" element={<BoardDetail />} />
          <Route
            path="/board/write"
            element={
              <PrivateRoute>
                <BoardWrite />
              </PrivateRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
