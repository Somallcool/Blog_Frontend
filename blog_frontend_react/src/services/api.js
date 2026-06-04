import axios from "axios";

const API_BASE_URL = "";
const API_V1_PATH = "/api/v1";

export const api = axios.create({
  baseURL: `${API_BASE_URL}${API_V1_PATH}`,
  headers: {
    Accept: "application/json, text/plain, */*",
    "ngrok-skip-browser-warning": "69420",
  },
  withCredentials: true,
});

function getToken() {
  return (
    sessionStorage.getItem("jwtToken") ||
    localStorage.getItem("jwtToken") ||
    null
  );
}

api.interceptors.request.use(
  (config) => {
    // const token = getToken();
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const errorDetail =
      error.response?.data?.message || error.response?.data || error.message;
    const reqeustUrl = error.config?.url || "";

    if (status == 401) {
      sessionStorage.clear();
      localStorage.clear();
      window.location.href = "/login";
    } else if (status == 403) {
      // console.error("403 Forbidden : 접근 권한이 없습니다.");
      // alert("접근 권한이 없습니다.");
      const silentPaths = ["/notifications", "/notifications/unread-count"];
      const isSilent = silentPaths.some((path) => reqeustUrl.includes(path));

      if (!isSilent) {
        console.error("403 Forbideen : 접근 권한이 없습니다.");
      }
    }

    const enhancedError = new Error(
      `API 요청 실패 : ${status || "Network Error"} - ${errorDetail}`,
    );
    enhancedError.status = status;
    enhancedError.originalError = error;
    return Promise.reject(enhancedError);
  },
);

/**
 * HTTP GET 요청
 * @param {string} endpoint - API 엔드포인트 경로 (예: '/boards' 또는 '/boards/1')
 * @returns {Promise<Object>} 서버로부터 받은 데이터
 */

export async function apiGet(endpoint) {
  try {
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    console.error("API GET 요청 실패 :", error);
    throw error;
  }
}

/**
 * HTTP POST 요청 (FormData 지원)
 * @param {string} endpoint - API 엔드포인트 경로
 * @param {FormData} formData - 폼 데이터 (텍스트 및 파일)
 * @returns {Promise<any>} 서버로부터 받은 응답
 */

export async function apiPost(endpoint, formData) {
  try {
    const response = await api.post(endpoint, formData, {
      headers: {
        "Content-type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("API POST 요청 실패 :", error);
    throw error;
  }
}

/**
 * HTTP POST 요청 (JSON Body)
 * @param {string} endpoint - API 엔드포인트 경로
 * @param {Object} jsonBody - JSON 형식의 요청 본문
 * @returns {Promise<Object>} 서버로부터 받은 데이터
 */

export async function apiPostJson(endpoint, jsonBody) {
  try {
    const response = await api.post(endpoint, jsonBody, {
      headers: {
        "Content-type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error("API JSON POST 요청 실패 : ", error);
    throw error;
  }
}

/**
 * HTTP PUT 요청 (JSON Body)
 * @param {string} endpoint - API 엔드포인트 경로
 * @param {Object} jsonBody - JSON 형식의 요청 본문
 * @returns {Promise<Object>} 서버로부터 받은 데이터
 */
export async function apiPut(endpoint, jsonBody) {
  try {
    const response = await api.put(endpoint, jsonBody, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error("API PUT 요청 실패:", error);
    throw error;
  }
}

/**
 * HTTP DELETE 요청
 * @param {string} endpoint - API 엔드포인트 경로
 * @returns {Promise<null>}
 */
export async function apiDelete(endpoint) {
  try {
    await api.delete(endpoint);
    return null;
  } catch (error) {
    console.error("API DELETE 요청 실패:", error);
    throw error;
  }
}

/**
 *
 * @param {String} endpoint
 * @param {Object} jsonBody
 * @returns {Promise<Object>}
 */
export async function apiPatch(endpoint, jsonBody = {}) {
  try {
    const response = await api.patch(endpoint, jsonBody, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error("API PATCH 요청 실패:", error);
    throw error;
  }
}

export function showMessage(message, type = "error") {
  console.log(`[${type.toUpperCase()} Message]: ${message}`);
  // 필요시 토스트 메시지 라이브러리로 대체 가능
  if (type === "error") {
    alert(message);
  }
}
