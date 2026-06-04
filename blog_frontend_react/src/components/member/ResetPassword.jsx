import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";

const API_BASE = "https://backward-plaster-pleading.ngrok-free.dev/api/v1";

const PW_REGEX =
  /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,100}$/;

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";

  const [tokenStatus, setTokenStatus] = useState("checking"); // checking | valid | invalid
  const [form, setForm] = useState({ newPassword: "", confirm: "" });
  const [errors, setErrors] = useState([]);
  const [submitStatus, setSubmitStatus] = useState("idle"); // idle | loading | success | error
  const [submitMessage, setSubmitMessage] = useState("");

  /* 토큰 유효성 사전 확인 */
  useEffect(() => {
    if (!token) {
      setTokenStatus("invalid");
      return;
    }
    axios
      .get(`${API_BASE}/password/reset-validate`, { params: { token } })
      .then(() => setTokenStatus("valid"))
      .catch(() => setTokenStatus("invalid"));
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    // 입력 시 해당 필드 에러 초기화
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.newPassword) {
      newErrors.newPassword = "새 비밀번호를 입력해주세요";
    } else if (!PW_REGEX.test(form.newPassword)) {
      newErrors.newPassword =
        "대문자와 특수문자를 각각 1개 이상 포함하여 8자 이상으로 입력해주세요";
    }
    if (!form.confirm) {
      newErrors.confirm = "비밀번호 확인을 해주세요";
    } else if (form.newPassword !== form.confirm) {
      newErrors.confirm = "비밀번호가 일치하지 않습니다.";
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setSubmitStatus("loading");
    setSubmitMessage("");
    try {
      const res = await axios.post(`${API_BASE}/password/reset`, {
        token,
        newPassword: form.newPassword,
      });
      setSubmitStatus("success");
      setSubmitMessage(res.data.message);

      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setSubmitStatus("error");
      setSubmitMessage(
        err.response?.data?.message ||
          "오류가 발생했습니다. 다시 시도해주세요.",
      );
    }
  };

  /* 토큰 확인 중 */
  if (tokenStatus === "checking") {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <p style={styles.checkingText}>링크 유효성 확인 중…</p>
        </div>
      </div>
    );
  }

  if (tokenStatus === "invalid") {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.header}>
            <div
              style={{
                ...styles.iconWrap,
                background: "#fef2f2",
                color: "#ef4444",
              }}
            >
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
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h1 style={styles.title}>링크가 만료되었습니다</h1>
            <p style={styles.subtitle}>
              재설정 링크가 유효하지 않거나 만료되었습니다.
              <br />
              비밀번호 찾기를 다시 요청해주세요.
            </p>
          </div>
          <a href="/find-password" style={styles.btnLink}>
            비밀번호 찾기 다시 요청
          </a>
        </div>
      </div>
    );
  }

  /* 비밀번호 재설정 폼 */
  return (
    <div style={styles.page}>
      <div style={styles.card}>
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
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h1 style={styles.title}>새 비밀번호 설정</h1>
          <p style={styles.subtitle}>새로 사용할 비밀번호를 입력해주세요.</p>
        </div>

        {submitStatus === "success" ? (
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
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p style={styles.successText}>{submitMessage}</p>
            <p style={styles.successHint}>
              잠시 후 로그인 페이지로 이동합니다.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={styles.form} noValidate>
            {/* 새 비밀번호 */}
            <div style={styles.fieldGroup}>
              <label style={styles.label} htmlFor="newPassword">
                새 비밀번호
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                value={form.newPassword}
                onChange={handleChange}
                placeholder="대문자·특수문자 포함 8자 이상"
                style={{
                  ...styles.input,
                  borderColor: errors.newPassword ? "#ef4444" : "#e5e7eb",
                }}
                autoComplete="new-password"
              />
              {errors.newPassword && (
                <span style={styles.fieldError}>{errors.newPassword}</span>
              )}
            </div>

            {/* 비밀번호 확인 */}
            <div style={styles.fieldGroup}>
              <label style={styles.label} htmlFor="confirm">
                비밀번호 확인
              </label>
              <input
                id="confirm"
                name="confirm"
                type="password"
                value={form.confirm}
                onChange={handleChange}
                placeholder="비밀번호를 다시 입력해주세요"
                style={{
                  ...styles.input,
                  borderColor: errors.confirm ? "#ef4444" : "#e5e7eb",
                }}
                autoComplete="new-password"
              />
              {errors.confirm && (
                <span style={styles.fieldError}>{errors.confirm}</span>
              )}
              {/* 일치 표시 */}
              {form.confirm &&
                !errors.confirm &&
                form.newPassword === form.confirm && (
                  <span style={styles.matchOk}>✓ 비밀번호가 일치합니다.</span>
                )}
            </div>

            {/* 비밀번호 조건 안내 */}
            <ul style={styles.hintList}>
              <li style={pwHintStyle(form.newPassword.length >= 8)}>
                • 8자 이상
              </li>
              <li style={pwHintStyle(/[A-Z]/.test(form.newPassword))}>
                • 영문 대문자 1개 이상
              </li>
              <li
                style={pwHintStyle(
                  /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(form.newPassword),
                )}
              >
                • 특수문자 1개 이상
              </li>
            </ul>

            {submitStatus === "error" && (
              <p style={styles.errorMsg}>{submitMessage}</p>
            )}

            <button
              type="submit"
              disabled={submitStatus === "loading"}
              style={{
                ...styles.btn,
                opacity: submitStatus === "loading" ? 0.7 : 1,
                cursor: submitStatus === "loading" ? "not-allowed" : "pointer",
              }}
            >
              {submitStatus === "loading" ? "처리 중…" : "비밀번호 변경"}
            </button>
          </form>
        )}

        <div style={styles.footer}>
          <a href="/login" style={styles.link}>
            로그인으로 돌아가기
          </a>
        </div>
      </div>
    </div>
  );
}
const pwHintStyle = (met) => ({
  fontSize: "12px",
  color: met ? "#22c55e" : "#9ca3af",
  transition: "color 0.2s",
});

/* 인라인 스타일*/
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
  checkingText: {
    textAlign: "center",
    color: "#6b7280",
    fontSize: "15px",
    padding: "24px 0",
    margin: 0,
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
    color: "#3b82f6",
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
    gap: "16px",
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
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
    background: "#fafafa",
    transition: "border-color 0.15s",
  },
  fieldError: {
    fontSize: "12px",
    color: "#ef4444",
  },
  matchOk: {
    fontSize: "12px",
    color: "#22c55e",
  },
  hintList: {
    listStyle: "none",
    margin: "0",
    padding: "10px 14px",
    background: "#f9fafb",
    borderRadius: "8px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
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
  btn: {
    marginTop: "4px",
    padding: "13px",
    background: "#3b82f6",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: "600",
    letterSpacing: "0.01em",
    transition: "background 0.15s",
  },
  btnLink: {
    display: "block",
    textAlign: "center",
    padding: "13px",
    background: "#3b82f6",
    color: "#fff",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: "600",
    textDecoration: "none",
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
    background: "#f0fdf4",
    color: "#22c55e",
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
