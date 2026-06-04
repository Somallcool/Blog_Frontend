import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import "./FindUsername.css";

const API_BASE_URL = "https://backward-plaster-pleading.ngrok-free.dev/api/v1";

function FindUsername() {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState(1); // 1: 이메일 입력, 2: 코드 입력, 3: 완료
  const [code, setCode] = useState("");
  const [timer, setTimer] = useState(0);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [message, setMessage] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimer(300);
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTime = (sec) => {
    const m = String(Math.floor(sec / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleSendCode = async () => {
    if (!email.trim()) {
      setMessage({ type: "error", text: "이메일을 입력해주세요." });
      return;
    }
    setSending(true);
    setMessage(null);
    try {
      const response = await fetch(`${API_BASE_URL}/email/send-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (response.ok) {
        setStep(2);
        setMessage({
          type: "success",
          text: "인증 코드가 발송되었습니다. 5분 이내에 입력해주세요.",
        });
        startTimer();
      } else {
        const data = await response.json().catch(() => ({}));
        setMessage({
          type: "error",
          text: data.message || "인증 코드 발송에 실패했습니다.",
        });
      }
    } catch {
      setMessage({ type: "error", text: "네트워크 오류가 발생했습니다." });
    } finally {
      setSending(false);
    }
  };

  const handleVerifyAndFind = async () => {
    if (!code.trim()) {
      setMessage({ type: "error", text: "인증 코드를 입력해주세요." });
      return;
    }
    setVerifying(true);
    setMessage(null);
    try {
      const verifyRes = await fetch(`${API_BASE_URL}/email/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      if (!verifyRes.ok) {
        const data = await verifyRes.json().catch(() => ({}));
        setMessage({
          type: "error",
          text: data.message || "인증 코드가 올바르지 않습니다.",
        });
        setVerifying(false);
        return;
      }

      const findRes = await fetch(`${API_BASE_URL}/email/find-username`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (findRes.ok) {
        if (timerRef.current) clearInterval(timerRef.current);
        setStep(3);
      } else {
        const data = await findRes.json().catch(() => ({}));
        setMessage({
          type: "error",
          text: data.message || "아이디를 찾을 수 없습니다.",
        });
      }
    } catch {
      setMessage({ type: "error", text: "네트워크 오류가 발생했습니다." });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="find-username-wrapper">
      <div className="find-username-card">
        <h2 className="find-title">아이디 찾기</h2>
        {step === 3 ? (
          <div className="find-result">
            <div className="result-icon">✉️</div>
            <p className="result-text">
              가입하신 이메일로 아이디가 발송되었습니다.
            </p>
            <p className="result-sub">{email}</p>
            <Link to="/login" className="go-login-btn">
              로그인 하러 가기
            </Link>
          </div>
        ) : (
          <>
            <p className="find-desc">
              가입 시 사용한 이메일로 아이디를 찾을 수 있어요.
            </p>
            {message && (
              <div className={`find-message ${message.type}`}>
                {message.text}
              </div>
            )}

            {/* 1단계: 이메일 입력 */}
            <div className="find-field">
              <label>이메일</label>
              <div className="find-input-row">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setMessage(null);
                  }}
                  placeholder="가입 시 사용한 이메일"
                  disabled={step === 2}
                />
                <button
                  type="button"
                  className="find-send-btn"
                  onClick={handleSendCode}
                  disabled={sending || (step === 2 && timer > 0)}
                >
                  {sending
                    ? "발송 중..."
                    : step === 2
                      ? `재발송${timer > 0 ? `(${formatTime(timer)})` : ""}`
                      : "인증 코드 발송"}
                </button>
              </div>
            </div>

            {/* 2단계 : 코드 입력 */}
            {step === 2 && (
              <div className="find-field">
                <label>인증 코드</label>
                <div className="find-input-row">
                  <div className="code-input-wrap">
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="6자리 인증 코드"
                      maxLength={6}
                    />
                    {timer > 0 && (
                      <span className="find-timer">{formatTime(timer)}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="find-verify-btn"
                    onClick={handleVerifyAndFind}
                    disabled={verifying || timer === 0}
                  >
                    {verifying ? "확인 중..." : "확인"}
                  </button>
                </div>
                {timer === 0 && (
                  <p className="timer-expired">
                    인증 코드가 만료되었습니다. 재발송해주세요.
                  </p>
                )}
              </div>
            )}
            <div className="find-links">
              <Link to="/login">로그인</Link>
              <span>·</span>
              <Link to="/signup">회원가입</Link>
              <span>·</span>
              <Link to="/find-password">비밀번호 찾기</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
export default FindUsername;
