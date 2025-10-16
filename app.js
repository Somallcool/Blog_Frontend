// app.js 예시 (Vanilla JS)

// 백엔드 서버 주소
const API_BASE_URL = 'http://localhost:8000/api/v1'; 

async function checkBackendConnection() {
    try {
        // 1. 백엔드에서 만든 테스트 API 호출
        const response = await fetch(`${API_BASE_URL}/boards/test`);
        const text = await response.text();

        // 2. 결과를 HTML에 표시하여 확인
        document.getElementById('status').textContent = 
            `백엔드 연결 성공: ${text}`;
            
    } catch (error) {
        console.error('백엔드 연결 실패:', error);
        document.getElementById('status').textContent = 
            '백엔드 연결 실패. 8000 포트가 열려 있는지, CORS 설정이 됐는지 확인하세요.';
    }
}

/**
 * HTTP POST 요청을 처리하는 범용 함수 (FormData 지원)
 * @param {string} endpoint - API 엔드포인트 경로 (예: '/boards')
 * @param {FormData} formData - 폼 데이터 (텍스트 및 파일)
 * @returns {Promise<Object>} 서버로부터 받은 JSON/텍스트 데이터
 */

async function apiGet(endpoint){
    try{
        const response = await fetch(`${API_BASE_URL}${endpoint}`,{
            method : 'GET',
        });

        if(!response.ok){
            const errorText = await response.text();
            throw new Error(`데이터 조회 실패 : ${response.status} - ${errorText}`);
        }

        return response.json();
    }
    catch(error){
        console.error('API GET 요청 실패 :',error);
        throw error;
    }
}

async function apiPost(endpoint, formData) {
    try {
        // FormData를 사용할 경우 Content-Type 헤더를 명시적으로 설정할 필요가 없습니다.
        // 브라우저가 자동으로 'multipart/form-data'를 설정해줍니다.
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            body: formData, 
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`게시글 작성 실패: ${response.status} - ${errorText}`);
        }
        
        // 서버 응답 본문을 텍스트로 반환
        return response.text(); 
        
    } catch (error) {
        console.error('API POST 요청 실패:', error);
        alert('작성 중 오류가 발생했습니다: ' + error.message);
        throw error;
    }
}


// 게시글 작성을 요청하는 함수
export const createBoardPost = (formData) => apiPost('/boards', formData);
export const fetchBoardList = () => apiGet('/boards');
export const checkConnection = checkBackendConnection; 