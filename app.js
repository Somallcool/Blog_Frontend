// app.js (Vanilla JS)

// 백엔드 서버 주소. 포트까지만 지정합니다.
const API_BASE_URL = 'http://localhost:8000'; 
const API_V1_PATH = '/api/v1'; // 모든 API 요청에 사용될 기본 경로

// ⭐ 수정된 부분: 로그인 기능을 구현하지 않은 상태이므로 토큰을 보내지 않음
function getToken() {
    return null; // 현재는 인증 토큰을 사용하지 않으므로 null 반환
}

/**
 * 인증 토큰을 포함한 기본 헤더 객체를 생성합니다.
 * 토큰이 없으면 Authorization 헤더를 포함하지 않습니다.
 * @param {boolean} isJson - Content-Type이 application/json인지 여부
 * @returns {Object} 헤더 객체
 */
function getAuthHeaders(isJson = true) {
    const headers = {};

    if (isJson) {
        headers['Content-Type'] = 'application/json';
    }

    const token = getToken();
    if (token) {
        // 토큰이 null이 아니어야 Authorization 헤더를 추가합니다.
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    headers['Accept'] = 'application/json, text/plain, */*';

    return headers;
}

function showMessage(message,type='error'){
    console.log(`[${type.toUpperCase()} Message]: ${message}`);
}


/**
 * HTTP GET 요청을 처리하는 범용 함수
 * @param {string} endpoint - API 엔드포인트 경로 (예: '/boards' 또는 '/boards/1')
 * @returns {Promise<Object>} 서버로부터 받은 JSON 데이터
 */

export async function apiGet(endpoint){
    try{
        const url = `${API_BASE_URL}${API_V1_PATH}${endpoint}`;
        
        const response = await fetch(url,{
            method : 'GET',
            // ⭐ 수정: getAuthHeaders는 토큰이 없으면 Authorization 헤더를 포함하지 않습니다.
            headers : getAuthHeaders(true), 
            credentials : 'include',
        });

        if(!response.ok){
            const errorText = await response.text();
            let errorMessage = `데이터 조회 실패 : ${response.status} - ${errorText}`;
            if (response.status === 403) {
                // ⭐ 중요: 서버의 권한 설정을 확인하도록 메시지 강조
                errorMessage = `403 Forbidden: 서버가 접근을 거부했습니다. (백엔드에서 해당 GET 엔드포인트의 인증 미들웨어를 확인/해제해야 합니다.)`;
            }
            throw new Error(errorMessage);
        }
        
        if(response.status === 204 || response.headers.get('content-length') === '0'){
            return {};
        }

        return response.json();
    }
    catch(error){
        console.error('API GET 요청 실패 :',error);
        throw error;
    }
}

/**
 * HTTP POST 요청을 처리하는 범용 함수 (FormData 지원)
 * @param {string} endpoint - API 엔드포인트 경로 (예: '/boards')
 * @param {FormData} formData - 폼 데이터 (텍스트 및 파일)
 * @returns {Promise<string>} 서버로부터 받은 응답 텍스트
 */

export async function apiPost(endpoint, formData) {
    try {
        const url = `${API_BASE_URL}${API_V1_PATH}${endpoint}`;
        
        // FormData이므로 Content-Type: application/json은 제외하고 인증 헤더만 가져옵니다.
        const headers = getAuthHeaders(false); 
        
        const response = await fetch(url, {
            method: 'POST',
            body: formData, 
            headers: headers, 
            credentials : 'include',
        });
        
        if (!response.ok) {
            let errorDetail = await response.text();
            try{
                const errorJson = JSON.parse(errorDetail);
                errorDetail = errorJson.message || errorDetail; 
            }
            catch(e) {}
             let errorMessage = `API POST 요청 실패 : ${response.status} - ${errorDetail}`;
            if (response.status === 403) {
                errorMessage = `403 Forbidden: 접근 권한이 없습니다. (게시글 작성 엔드포인트에 대한 서버 인증 설정 확인)`;
            }
            throw new Error(errorMessage);
        }
        
        return response.text(); 
        
    } catch (error) {
        console.error('API POST 요청 실패:', error);
        showMessage('작성 중 오류가 발생했습니다 : '+error.message);
        throw error;
    }
}


/**
 * HTTP PUT 요청을 처리하는 범용 함수 (JSON Body)
 * @param {string} endpoint - API 엔드포인트 경로 (예: '/boards/1')
 * @param {Object} jsonBody - JSON 형식의 요청 본문
 * @returns {Promise<Object|string>} 서버로부터 받은 JSON/텍스트 데이터
 */
export async function apiPut(endpoint, jsonBody){ 
    const url = `${API_BASE_URL}${API_V1_PATH}${endpoint}`;
    
    const options = {
        method : 'PUT', 
        headers : getAuthHeaders(true), 
        body: JSON.stringify(jsonBody),
        credentials : 'include',
    };

    try{
        const response = await fetch(url,options);

        if(!response.ok){
            let errorText = await response.text();
            try{
                const errorJson = JSON.parse(errorText);
                errorText = errorJson.message || errorText;
            }
            catch(e){
                // JSON 파싱 실패 시 원본 텍스트 유지
            }
            let errorMessage = `API 요청 실패 : ${response.status} - ${errorText}`;
            if (response.status === 403) {
                // ⭐ 중요: 서버의 권한 설정을 확인하도록 메시지 강조
                errorMessage = `403 Forbidden: 접근 권한이 없습니다. (백엔드에서 해당 PUT 엔드포인트의 인증/권한 미들웨어를 확인/해제해야 합니다.)`;
            }
            throw new Error(errorMessage);
        }

        const contentType = response.headers.get("content-type");
        if(contentType && contentType.includes("application/json")){
            return response.json();
        }
        else{
            return response.text();
        }
    }
    catch(error){
        console.error(`[API Call Error] PUT ${url} :`, error);
        throw error;
    }
}

/**
 * HTTP POST 요청을 처리하는 범용 함수 (JSON Body)
 * @param {string} endpoint - API 엔드포인트 경로 (예: '/markdown-preview')
 * @param {Object} jsonBody - JSON 형식의 요청 본문
 * @returns {Promise<Object|string>} 서버로부터 받은 JSON/텍스트 데이터
 */
export async function apiPostJson(endpoint, jsonBody){
    try{
        const url = `${API_BASE_URL}${API_V1_PATH}${endpoint}`;
        
        const response = await fetch(url,{
            method : 'POST',
            headers : getAuthHeaders(true), 
            body : JSON.stringify(jsonBody),
            credentials : 'include',
        });
        
        if(!response.ok){
            let errorDetail = await response.text();
            try{
                const errorJson = JSON.parse(errorDetail); 
                errorDetail = errorJson.message || errorDetail;
            }
            catch(e){} 
            
            let errorMessage = `API JSON POST 요청 실패 : ${response.status} - ${errorDetail}`;
            if (response.status === 403) {
                errorMessage = `403 Forbidden: 접근 권한이 없습니다.`;
            }
            throw new Error(errorMessage);
        }
        
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
            return response.json();
        }
        else{
            return response.text(); 
        }
        
    }
    catch(error){
        console.error('API JSON POST 요청 실패 :',error);
        showMessage('데이터 전송 중 오류가 발생했습니다 : '+error.message);
        throw error;
    }
}

export async function apiDelete(endpoint){
    try{
        const url = `${API_BASE_URL}${API_V1_PATH}${endpoint}`;
        const response = await fetch(url,{
            method : 'DELETE',
            headers : getAuthHeaders(true),
            credentials : 'include',
        });
        if(!response.ok){
            let errorText = await response.text();
            try{
                const errorJson = JSON.parse(errorText);
                errorText = errorJson.message || errorText;
            }
            catch(e){

            }
            let errorMessage = `API DELETE 요청 실패 : ${response.status} - ${errorText}`;
            if(response.status === 403){
                errorMessage = `403 Forbidden : 접근 권한이 없습니다.`;
            }
            throw new Error(errorMessage);
        }
        return null;
    }
    catch(error){
        console.error('API DELETE 요청 실패 :', error);
        throw error;
    }
}

// Global window 객체에 함수 등록
window.apiGet = apiGet;
window.apiPost = apiPost;
window.apiPostJson = apiPostJson;
window.apiPut = apiPut; 
window.apiDelete = apiDelete;
