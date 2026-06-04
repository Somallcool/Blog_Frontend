import { apiPostJson, apiGet } from "./api";

const API_BASE_URL = "https://backward-plaster-pleading.ngrok-free.dev/api/v1";
const LOGOUT_API_URL = `${API_BASE_URL}/logout`;

export const authService = {
  /**
   * 로그인 (기존 fetch 방식 사용 - HttpOnly 쿠키 처리)
   * @param {Object} credentials - { username, password }
   * @returns {Promise<Object>} { nickname }
   */
  login: async (credentials) => {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "69420",
        },
        credentials: "include",
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: "로그인에 실패했습니다.",
        }));
        throw new Error(errorData.message);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      throw new Error(error.message || "로그인에 실패했습니다.");
    }
  },

  /**
   * 회원가입
   * @param {Object} userData - { username, email, password, nickname }
   * @returns {Promise<Object>}
   */
  signup: async (userData) => {
    try {
      const response = await apiPostJson("/signup", userData);
      return response;
    } catch (error) {
      throw new Error(error.message || "회원가입에 실패했습니다.");
    }
  },

  /**
   * 로그아웃 (기존 fetch 방식 유지 - HttpOnly 쿠키 처리)
   * @returns {Promise<void>}
   */
  logout: async () => {
    try {
      await fetch(LOGOUT_API_URL, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("로그아웃 요청 중 오류 발생:", error);
      // 에러가 발생해도 로컬 상태는 정리되어야 함
    }
  },

  /**
   * 중복 확인 (아이디, 이메일, 닉네임)
   * @param {string} field - 'username' | 'email' | 'nickname'
   * @param {string} value - 확인할 값
   * @returns {Promise<boolean>} true: 중복, false: 사용 가능
   */
  checkDuplicate: async (field, value) => {
    try {
      const response = await apiPostJson("/auth/check-duplicate", {
        field,
        value,
      });
      return response.isDuplicate || false;
    } catch (error) {
      throw new Error("중복 확인 중 오류가 발생했습니다.");
    }
  },

  /**
   * 카카오 로그인
   * @param {string} code - 카카오 인가 코드
   * @returns {Promise<Object>} { token, user }
   */
  kakaoLogin: async (code) => {
    try {
      const response = await apiPostJson("/oauth/kakao", { code });
      return response;
    } catch (error) {
      throw new Error("카카오 로그인에 실패했습니다.");
    }
  },

  /**
   * 네이버 로그인
   * @param {string} code - 네이버 인가 코드
   * @param {string} state - CSRF 방지 토큰
   * @returns {Promise<Object>} { token, user }
   */
  naverLogin: async (code, state) => {
    try {
      const response = await apiPostJson("/oauth/naver", { code, state });
      return response;
    } catch (error) {
      throw new Error("네이버 로그인에 실패했습니다.");
    }
  },

  /**
   * 토큰 검증
   * @returns {Promise<Object>} 사용자 정보
   */
  verifyToken: async () => {
    try {
      const response = await apiGet("/auth/verify");
      return response;
    } catch (error) {
      throw new Error("토큰 검증에 실패했습니다.");
    }
  },

  /**
   * 사용자 정보 조회
   * @returns {Promise<Object>} 사용자 정보
   */
  getUserInfo: async () => {
    try {
      const response = await apiGet("/user/me");
      return response;
    } catch (error) {
      throw new Error("사용자 정보 조회에 실패했습니다.");
    }
  },

  /**
   * 구글 로그인 URl 조회 후 리다이렉트
   * @returns {Promise<void>}
   */
  googleLogin: async () => {
    try {
      const response = await apiGet("/oauth/google/url");
      window.location.href = response.googleAuthUrl;
    } catch (error) {
      throw new Error("구글 로그인 URL 조회에 실패했습니다.");
    }
  },

  /**
   *  소셜 로그인 콜백 처리 (URL 파라미터에서 토큰 닉네임 추출)
   *  @returns {{ token : String, nickname: String} | null}
   */

  handleSocialLoginCallback: () => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const nickname = params.get("nickname");

    if (token && nickname) {
      // URL 파라미터 제거( 뒤로가기 시 재처리 방지)
      window.history.replaceState({}, document.title, window.location.pathname);
      return { token, nickname };
    }
    return null;
  },
};
