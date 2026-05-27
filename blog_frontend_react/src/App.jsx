// src/App.jsx
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  // useNavigate,
  // useLocation,
} from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Navbar from "./components/common/Navbar.jsx";
import Login from "./components/member/Login.jsx";
import Signup from "./components/member/Signup.jsx";
import Mypage from "./components/member/Mypage.jsx";
import BoardList from "./components/board/BoardList.jsx";
import BoardDetail from "./components/board/BoardDetail.jsx";
import BoardWrite from "./components/board/BoardWrite.jsx";
import "./App.css";
import SearchPage from "./components/common/SearchPage.jsx";
import AdminReportsPage from "./pages/admin/AdminReportsPage.jsx";
import NotificationsPage from "./pages/notifications/NotificationsPage.jsx";
// 인증이 필요한 라우트 보호 컴포넌트
function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return null;

  return isAuthenticated ? children : <Navigate to="/login" />;
}

// URL에서 토큰 처리하는 컴포넌트
// function TokenHandler() {
//   const { login } = useAuth();
//   // const navigate = useNavigate();
//   // const location = useLocation();

//   useEffect(() => {
//     const urlParams = new URLSearchParams(window.location.search);
//     const jwtToken = urlParams.get("token");
//     const userNickname = urlParams.get("nickname");

//     if (jwtToken && userNickname) {
//       login({ nickname: userNickname }, jwtToken);
//       window.history.replaceState({}, document.title, window.location.pathname);
//     }
//   }, []);

//   return null;
// }

function AppContent() {
  return (
    <div className="App">
      <Navbar />

      {/* <TokenHandler /> */}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<BoardList />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/search" element={<SearchPage />} />
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
          <Route
            path="/admin/reports"
            element={
              <PrivateRoute>
                <AdminReportsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <PrivateRoute>
                <NotificationsPage />
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
