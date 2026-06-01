import { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Signup.css";

const API_BASE_URL = "http://localhost:8000/api/v1";

function Signup() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    passwordCheck: "",
    nickname: "",
    emailId: "",
    emailDomain: "manual",
    emailDomainManual: "",
  });

  const [validation, setValidation] = useState({
    username: { checked: false, available: false },
    nickname: { checked: false, available: false },
    password: { valid: false, message: "" },
    passwordMatch: { valid: false, message: "" },
  });

  const [emailVerification, setEmailVerification] = useState({
    codeSent: false,
    code: "",
    verified: false,
    timer: 0,
    sending: false,
    verifying: false,
    mesage: null,
  });

  const timerRef = useRef(null);

  const [statusMessage, setStatusMessage] = useState("대기중...");
  const [statusColor, setStatusColor] = useState("green");
  const [showManualInput, setShowManualInput] = useState(true);

  const pwRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.*[a-zA-Z0-9!@#$%^&*]).{8,}$/;

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setEmailVerification((prev) => ({ ...prev, timer: 300 }));
    timerRef.current = setInterval(() => {
      setEmailVerification((prev) => {
        if (prev.timer <= 1) {
          clearInterval(timerRef.current);
          return { ...prev, timer: 0 };
        }
        return { ...prev, timer: prev.timer - 1 };
      });
    }, 1000);
  };

  const formatTime = (sec) => {
    const m = String(Math.floor(sec / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  const getCombinedEmail = () => {
    const { emailId, emailDomain, emailDomainManual } = formData;
    const domain = showManualInput ? emailDomainManual : emailDomain;
    if (emailId && domain && domain !== "manual") return `${emailId}@${domain}`;
    return "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "password") {
      validatePassword(value);
    }

    if (name === "passwordCheck") {
      validatePasswordMatch(formData.password, value);
    }
    if (name === "username") {
      setValidation((prev) => ({
        ...prev,
        username: { checked: false, available: false },
      }));
    }
    if (name === "nickname") {
      setValidation((prev) => ({
        ...prev,
        nickname: { checked: false, available: false },
      }));
    }
    if (name === "emailId" || name === "emailDomainManual") {
      setEmailVerification((prev) => ({
        ...prev,
        codeSent: false,
        verified: false,
        code: "",
        timer: 0,
        message: null,
      }));
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const validatePassword = (pw) => {
    if (!pwRegex.test(pw)) {
      setValidation((prev) => ({
        ...prev,
        password: {
          valid: false,
          message: "비밀번호는 8자 이상, 대문자/특수문자를 포함해야 합니다.",
        },
      }));
    } else {
      setValidation((prev) => ({
        ...prev,
        password: { valid: true, message: "사용 가능한 비밀번호입니다." },
      }));
    }
    if (formData.passwordCheck) {
      validatePasswordMatch(pw, formData.passwordCheck);
    }
  };

  const validatePasswordMatch = (pw, pwcheck) => {
    if (pwcheck.length === 0) {
      setValidation((prev) => ({
        ...prev,
        passwordMatch: {
          valid: false,
          message: "비밀번호 확인란을 입력하지 않았습니다.",
        },
      }));
    } else if (pw === pwcheck) {
      setValidation((prev) => ({
        ...prev,
        passwordMatch: { valid: true, message: "비밀번호가 일치합니다." },
      }));
    } else {
      setValidation((prev) => ({
        ...prev,
        passwordMatch: {
          valid: false,
          message: "비밀번호가 일치하지 않습니다.",
        },
      }));
    }
  };

  const handleIdCheck = async () => {
    const { username } = formData;
    const idRegex = /^[a-zA-Z0-9]{4,12}$/;

    if (!idRegex.test(username)) {
      alert("아이디는 4~12자 이하의 영문자 또는 숫자만 가능합니다.");
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/check/id`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: username }),
      });
      if (response.ok) {
        alert("사용가능한 아이디입니다.");
        setValidation((prev) => ({
          ...prev,
          username: { checked: true, available: true },
        }));
      } else if (response.status === 409) {
        alert("이미 사용중인 아이디입니다.");
        setValidation((prev) => ({
          ...prev,
          username: { checked: true, available: false },
        }));
      } else {
        alert(`서버 통신 오류 : 상태 코드 ${response.status}`);
      }
    } catch (error) {
      console.error(`Fetch 통신 오류 : `, error);
      alert("네트워크 오류 : 백엔드 서버 확인 필요");
    }
  };
  const handleNickCheck = async () => {
    const { nickname } = formData;
    const nickRegex = /^.{2,12}$/;

    if (!nickRegex.test(nickname)) {
      alert("닉네임은 2자 ~ 12자 이하로 입력해주세요");
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/check/nickname`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nick: nickname }),
      });
      if (response.ok) {
        alert("사용 가능한 닉네임입니다.");
        setValidation((prev) => ({
          ...prev,
          nickname: { checked: true, available: true },
        }));
      } else if (response.status === 409) {
        alert("이미 사용중인 닉네임입니다.");
        setValidation((prev) => ({
          ...prev,
          nickname: { checked: true, available: false },
        }));
      } else {
        alert(`서버 통신 오류 : 상태코드 ${response.status}`);
      }
    } catch (error) {
      console.error("Fetch 통신 오류", error);
      alert("네트워크 오류 : 백엔드 서버 확인 필요");
    }
  };

  const handleSendCode = async () => {
    const email = getCombinedEmail();
    if (!email) {
      alert("이메일을 올바르게 입력해주세요.");
      return;
    }
    setEmailVerification((prev) => ({ ...prev, sending: true, mesage: null }));
    try {
      const response = await fetch(`${API_BASE_URL}/email/send-verification`, {
        method: "POST",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (response.ok) {
        setEmailVerification((prev) => ({
          ...prev,
          codeSent: true,
          sending: false,
          verified: false,
          code: "",
          message: {
            type: "success",
            text: "인증 코드가 발송되었습니다. 5분 이내에 입력해주세요.",
          },
        }));
        startTimer();
      } else {
        const data = await response.json().catch(() => ({}));
        setEmailVerification((prev) => ({
          ...prev,
          sending: false,
          message: {
            type: "error",
            text: data.message || "인증 코드 발송에 실패했습니다.",
          },
        }));
      }
    } catch {
      setEmailVerification((prev) => ({
        ...prev,
        sending: false,
        message: { type: "error", text: "네트워크 오류가 발생했습니다." },
      }));
    }
  };

  const handleVerifyCode = async () => {
    const email = getCombinedEmail();
    if (!emailVerification.code.trim()) {
      alert("인증 코드를 입력해주세요");
      return;
    }
    setEmailVerification((prev) => ({
      ...prev,
      verifying: true,
      message: null,
    }));
    try {
      const response = await fetch(`${API_BASE_URL}/email/verify`, {
        method: "POST",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify({ email, code: emailVerification.code }),
      });
      if (response.ok) {
        if (timerRef.current) clearInterval(timerRef.current);
        setEmailVerification((prev) => ({
          ...prev,
          verified: true,
          verifying: false,
          timer: 0,
          message: { type: "success", text: "이메일 인증이 완료되었습니다." },
        }));
      } else {
        const data = await response.json().catch(() => ({}));
        setEmailVerification((prev) => ({
          ...prev,
          verifying: false,
          message: {
            type: "error",
            text: data.message || "인증 코드가 올바르지 않습니다.",
          },
        }));
      }
    } catch {
      setEmailVerification((prev) => ({
        ...prev,
        verifying: false,
        mesage: { type: "error", text: "네트워크 오루가 발생했습니다." },
      }));
    }
  };

  const handleDomainChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, emailDomain: value }));
    if (value === "manual") {
      setShowManualInput(true);
    } else {
      setShowManualInput(false);
    }
  };

  const toggleToSelect = () => {
    setShowManualInput(false);
    setFormData((prev) => ({
      ...prev,
      emailDomain: "manual",
      emailDomainManual: "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validation.username.checked || !validation.username.available) {
      alert("아이디 중복 확인을 해주세요");
      return;
    }
    if (!validation.nickname.checked || !validation.nickname.available) {
      alert("닉네임 중복 확인을 해주세요");
      return;
    }
    if (!validation.password.valid) {
      alert("비밀번호 형식이 올바르지 않습니다.");
      return;
    }
    if (!validation.passwordMatch.valid) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }
    if (!emailVerification.verified) {
      alert("이메일 인증을 완료해주세요");
      return;
    }
    const email = getCombinedEmail();
    if (!email) {
      alert("이메일을 올바르게 입력해주세요");
      return;
    }
    setStatusMessage("가입 중...");
    setStatusColor("blue");

    const data = {
      username: formData.username,
      password: formData.password,
      nickname: formData.nickname,
      email,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/member`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setStatusMessage("회원가입 성공");
        setStatusColor("green");
        alert("회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.");
        setTimeout(() => navigate("/login"), 1500);
      } else {
        const errorData = await response.json().catch(() => ({
          message: `상태코드 ${response.status} 오류`,
        }));
        setStatusMessage(`가입 실패 :${errorData.message}`);
        setStatusColor("red");
      }
    } catch (error) {
      setStatusColor("darkred");
      setStatusMessage("네트워크 통신 오류: 백엔드 서버 확인 필요");
    }
  };

  const canSubmit =
    validation.username.available &&
    validation.nickname.available &&
    validation.password.valid &&
    validation.passwordMatch.valid &&
    emailVerification.verified;

  return (
    <div id="main-container">
      <header id="form-header">
        <h2>회원가입</h2>
      </header>

      <form id="signup-form" onSubmit={handleSubmit}>
        {/* 아이디 */}
        <div className="form-group">
          <label htmlFor="username">아이디 : </label>
          <input
            type="text"
            name="username"
            id="username"
            value={formData.username}
            onChange={handleChange}
          />
          <button type="button" id="id_check" onClick={handleIdCheck}>
            중복확인
          </button>
        </div>

        {/* 비밀번호 */}
        <div className="form-group">
          <label htmlFor="password">비밀번호 : </label>
          <input
            type="password"
            name="password"
            id="password"
            value={formData.password}
            onChange={handleChange}
          />
        </div>

        {/* 비밀번호 확인*/}
        <div className="form-group">
          <label htmlFor="passwordCheck">비밀번호 확인 : </label>
          <input
            type="password"
            name="passwordCheck"
            id="passwordCheck"
            value={formData.passwordCheck}
            onChange={handleChange}
          />
        </div>

        {/* 비밀번호 일치 메세지 */}
        <div
          id="pw-match-message"
          style={{
            color: validation.password.valid
              ? validation.passwordMatch.valid
                ? "green"
                : "red"
              : "orange",
          }}
        >
          {validation.password.message || validation.passwordMatch.message}
        </div>

        {/* 닉네임 */}
        <div className="form-group">
          <label htmlFor="nickname">닉네임 : </label>
          <input
            type="text"
            name="nickname"
            id="nickname"
            value={formData.nickname}
            onChange={handleChange}
          />
          <button type="button" id="nickname_check" onClick={handleNickCheck}>
            중복확인
          </button>
        </div>

        {/* 이메일 */}
        <div className="form-group email-group">
          <label htmlFor="email_id">이메일 : </label>
          <input
            type="text"
            name="emailId"
            id="email_id"
            placeholder="ID 입력"
            value={formData.emailId}
            onChange={handleChange}
          />
          <span>@</span>
          {!showManualInput ? (
            <select
              id="email_domain_select"
              value={formData.emailDomain}
              onChange={handleDomainChange}
            >
              <option value="manual">직접입력</option>
              <option value="naver.com">naver.com</option>
              <option value="daum.net">daum.net</option>
              <option value="gmail.com">gmail.com</option>
              <option value="nate.com">nate.com</option>
            </select>
          ) : (
            <div id="manual-input-wrapper">
              <input
                type="text"
                id="email_domain_manual"
                name="emailDomainManual"
                placeholder="직접 입력"
                value={formData.emailDomainManual}
                onChange={handleChange}
              />
              <button
                type="button"
                id="toggle-select-btn"
                onClick={toggleToSelect}
              >
                &#9660;
              </button>
            </div>
          )}
          {/* 인증 코드 발송 버튼 */}
          {!emailVerification.verified && (
            <button
              type="button"
              className="email-send-btn"
              onClick={handleSendCode}
              disabled={
                emailVerification.sending || emailVerification.timer > 0
              }
            >
              {emailVerification.sending
                ? "발송 중..."
                : emailVerification.codeSent
                  ? `재발송${emailVerification.timer > 0 ? ` (${formatTime(emailVerification.timer)})` : ""}`
                  : "인증 코드 발송"}
            </button>
          )}
          {emailVerification.verified && (
            <span className="email-verified-badge">인증 완료</span>
          )}
        </div>

        {/* 인증 코드 입력 */}
        {emailVerification.codeSent && !emailVerification.verified && (
          <div className="form-group verify-group">
            <label>인증 코드 : </label>
            <input
              type="text"
              className="verify-input"
              value={emailVerification.code}
              onChange={(e) =>
                setEmailVerification((prev) => ({
                  ...prev,
                  code: e.target.value,
                }))
              }
              placeholder="6자리 인증 코드 입력"
              maxLength={6}
            />
            {emailVerification.timer > 0 && (
              <span className="verify-timer">
                {formatTime(emailVerification.timer)}
              </span>
            )}
            <button
              type="button"
              className="verify-btn"
              onClick={handleVerifyCode}
              disabled={
                emailVerification.verifying || emailVerification.timer === 0
              }
            >
              {emailVerification.verifying ? "확인 중..." : "확인"}
            </button>
          </div>
        )}

        {/* 인증 메세지 */}
        {emailVerification.mesage && (
          <div className={`verify-message ${emailVerification.mesage.type}`}>
            {emailVerification.mesage.text}
          </div>
        )}

        {/* 제출버튼 */}
        <div id="submit-group">
          <button type="submit">가입하기</button>
        </div>
        {/* 로그인 링크 */}
        <div
          className="login-link"
          style={{ marginTop: "1rem", textAlign: "center" }}
        >
          <span>이미 계정이 있으신가요?</span>
          <Link to="/login">로그인</Link>
        </div>
      </form>
    </div>
  );
}
export default Signup;
