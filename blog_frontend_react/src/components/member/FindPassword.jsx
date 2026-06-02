import { useState } from "react";
import axios from "axios";

const API_BASE = "http://localhost:8000/api/v1";

export default function FindPassword() {
  const [form, setForm] = useState({ username: "", email: "" });
  const [status, setStatus] = useState("idle"); // idle |loading | success | error
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username.trim() || !form.email.trim()) {
      setStatus("error");
      setMessage("아이디와 이메일을 모두 입력해주세요");
      return;
    }
    setStatus("loading");
    setMessage("");

    try {
      const res = await axios.post(`${API_BASE}/password/reset-request`, {
        username: form.username,
        email: form.email,
      });
      setStatus("success");
      setMessage(res.data.message);
    } catch (err) {
      setStatus("error");
      setMessage(
        err.response?.data?.meesage || "요청 처리 중 오류가 발생했습니다.",
      );
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* 헤더 */}
        <div style={styles.header}>
          <div style={styles.iconWrap}>
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h1 style={styles.title}>비밀번호 찾기</h1>
          <p style={styles.subtitle}>
            가입 시 사용한 아이디와 이메일을 입력하면
            <br />
            비밀번호 재설정 링크를 보내드립니다.
          </p>
        </div>

        {/* 성공 상태 */}
        {status === "success" ? (
          <div style={styles.successBox}>
            <div style={styles.successIcon}>
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 2L11 13" />
                <path d="M22 2L15 22 11 13 2 9l20-7z" />
              </svg>
            </div>
            <p style={styles.successText}>{message}</p>
            <p style={styles.successHint}>
              스팸 메일함도 확인해보세요. 링크 유효 시간은 30분입니다.
            </p>
          </div>
        ) : (
          /* 폼 */
          <form onSubmit={handleSubmit} style={styles.form} noValidate>
            <div style={styles.fieldGroup}>
              <label style={styles.label} htmlFor="username">
                아이디
              </label>
              <input
                id="username"
                name="username"
                type="text"
                value={form.username}
                onChange={handleChange}
                placeholder="가입한 아이디 입력"
                style={styles.input}
                autoComplete="username"
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label} htmlFor="email">
                이메일
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="가입한 이메일 입력"
                style={styles.input}
                autoComplete="email"
              />
            </div>

            {status === "error" && <p style={styles.errorMsg}>{message}</p>}

            <button
              type="submit"
              disabled={status === "loading"}
              style={{
                ...styles.btn,
                opacity: status === "loading" ? 0.7 : 1,
                cursor: status === "loading" ? "not-allowed" : "pointer",
              }}
            >
              {status === "loading" ? "전송 중…" : "재설정 링크 받기"}
            </button>
          </form>
        )}

        {/* 하단 링크 */}
        <div style={styles.footer}>
          <a href="/login" style={styles.link}>
            로그인으로 돌아가기
          </a>
        </div>
      </div>
    </div>
  );
}

/* 인라인 스타일 */
const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f5f5f5",
    padding: "24px",
    fontFamily: "'Pretendard', 'Noto Sans KR', sans-serif",
  },
  card: {
    background: "#fff",
    borderRadius: "16px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.09)",
    padding: "40px 36px",
    width: "100%",
    maxWidth: "420px",
  },
  header: {
    textAlign: "center",
    marginBottom: "32px",
  },
  iconWrap: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    background: "#eff6ff",
    color: "#2c3e50",
    marginBottom: "16px",
  },
  title: {
    fontSize: "22px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 8px",
  },
  subtitle: {
    fontSize: "14px",
    color: "#6b7280",
    lineHeight: "1.6",
    margin: 0,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#374151",
  },
  input: {
    padding: "12px 14px",
    border: "1.5px solid #e5e7eb",
    borderRadius: "8px",
    fontSize: "15px",
    color: "#111827",
    outline: "none",
    transition: "border-color 0.15s",
    background: "#fafafa",
  },
  btn: {
    marginTop: "4px",
    padding: "13px",
    background: "#2c3e50",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: "600",
    letterSpacing: "0.01em",
    transition: "background 0.15s",
    alignSelf: "center",
  },
  errorMsg: {
    margin: 0,
    padding: "10px 14px",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "8px",
    fontSize: "13px",
    color: "#dc2626",
  },
  successBox: {
    textAlign: "center",
    padding: "8px 0",
  },
  successIcon: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "64px",
    height: "64px",
    borderRadius: "50%",
    background: "#eff6ff",
    color: "#2c3e50",
    marginBottom: "16px",
  },
  successText: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#111827",
    margin: "0 0 8px",
  },
  successHint: {
    fontSize: "13px",
    color: "#9ca3af",
    margin: 0,
  },
  footer: {
    textAlign: "center",
    marginTop: "24px",
  },
  link: {
    fontSize: "13px",
    color: "#6b7280",
    textDecoration: "none",
    borderBottom: "1px solid #e5e7eb",
    paddingBottom: "1px",
  },
};
