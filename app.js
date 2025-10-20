// app.js 예시 (Vanilla JS)

// 백엔드 서버 주소. 포트까지만 지정합니다.
const API_BASE_URL = 'http://localhost:8000'; 
const API_V1_PATH = '/api/v1'; // 모든 API 요청에 사용될 기본 경로

function showMessage(message,type='error'){
    console.log(`[${type.toUpperCase()}Message]: ${message}`);
}

export async function checkBackendConnection() {
    try {
        // 백엔드의 테스트 API 경로가 /boards/test라고 가정하고 호출합니다.
        const response = await fetch(`${API_BASE_URL}/boards/test`);
        const text = await response.text();

        // 2. 결과를 HTML에 표시하여 확인
        const statusElement = document.getElementById('status');
        if(statusElement){
            statusElement.textContent = `백엔드 연결 성공 : ${text} `;
        }
        
    } catch (error) {
        console.error('백엔드 연결 실패:', error);
        const statusElement =document.getElementById('status');
        if(statusElement){
            statusElement.textContent='백엔드 연결 실패. 8000 포트가 열려 있는지, CORS 설정이 됐는지 확인하세요.';
        } 
    }
}

/**
 * HTTP GET 요청을 처리하는 범용 함수
 * @param {string} endpoint - API 엔드포인트 경로 (예: '/boards' 또는 '/boards/1')
 * @returns {Promise<Object>} 서버로부터 받은 JSON 데이터
 */
export async function apiGet(endpoint){
    try{
        // /api/v1 경로를 추가하여 호출
        const url = `${API_BASE_URL}${API_V1_PATH}${endpoint}`;
        
        const response = await fetch(url,{
            method : 'GET',
            headers : {
                'Content-type' : 'application/json',
            },
        });

        if(!response.ok){
            const errorText = await response.text();
            throw new Error(`데이터 조회 실패 : ${response.status} - ${errorText}`);
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
        // /api/v1 경로를 추가하여 호출
        const url = `${API_BASE_URL}${API_V1_PATH}${endpoint}`;
        
        // FormData를 사용할 경우 Content-Type 헤더를 명시적으로 설정할 필요가 없습니다.
        const response = await fetch(url, {
            method: 'POST',
            body: formData, 
        });
        
        if (!response.ok) {
            let errorDetail = await response.text();
            try{
                const errorJson = JSON.parse(errorDetail);
                errorDetail = errorJson.message || errorDetail; 
            }
            catch(e) {
                // JSON 파싱 실패 시 원본 텍스트 유지
            }
            throw new Error(`API POST 요청 실패 : ${response.status} - ${errorDetail}`);
        }
        
        // 서버 응답 본문을 텍스트로 반환 (게시글 생성 메시지 등)
        return response.text(); 
        
    } catch (error) {
        console.error('API POST 요청 실패:', error);
        showMessage('작성 중 오류가 발생했습니다 : '+error.message);
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
        // /api/v1 경로를 추가하여 호출
        const url = `${API_BASE_URL}${API_V1_PATH}${endpoint}`;
        
        const response = await fetch(url,{
            method : 'POST',
            headers : {
                'Content-Type' : 'application/json', 
                'Accept' : 'application/json, text/plain, */*'
            },
            body : JSON.stringify(jsonBody),
        });
        
        if(!response.ok){
            let errorDetail = await response.text();
            try{
                const errorJson = JSON.parse(errorDetail); 
                errorDetail = errorJson.message || errorDetail;
            }
            catch(e){} 
            
            throw new Error(`API JSON POST 요청 실패 : ${response.status} - ${errorDetail}`);
        }
        
        // 응답 Content-Type에 따라 JSON 또는 텍스트 반환
        const contentType = response.headers.get('content-type');
        
        // 서버가 text/html 또는 text/plain 응답을 보내더라도, JSON으로 파싱하려는 시도를 막고
        // HTML 문자열로 받아오도록 로직을 강화했습니다.
        if (contentType && contentType.includes('application/json')) {
            return response.json();
        }
        else{
            return response.text(); // 마크다운 미리보기 응답은 이 경로를 탑니다.
        }
        
    }
    catch(error){
        console.error('API JSON POST 요청 실패 :',error);
        showMessage('데이터 전송 중 오류가 발생했습니다 : '+error.message);
        throw error;
    }
}

// Global window 객체에 함수 등록
window.checkBackendConnection = checkBackendConnection;
window.apiGet = apiGet;
window.apiPost = apiPost;
window.apiPostJson = apiPostJson;
