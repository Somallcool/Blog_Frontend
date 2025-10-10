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
            '백엔드 연결 실패. 8080 포트가 열려 있는지, CORS 설정이 됐는지 확인하세요.';
    }
}

// HTML 로딩 후 실행
window.onload = checkBackendConnection;