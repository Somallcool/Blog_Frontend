const SIGNUP_ENDPOINT = '/member';
const API_BASE_URL = 'http://localhost:8000/api/v1'; 
const signupForm = document.getElementById('signup-form');
const statusDiv = document.getElementById('status');

signupForm.addEventListener('submit', async function(event) {
    event.preventDefault();

    statusDiv.textContent = '가입 요청 중 . . .';
    statusDiv.style.color = 'blue';

    // 1. 폼 데이터 수집
    const data = {
        username: document.getElementById('username').value, 
        password: document.getElementById('password').value,
        nickname: document.getElementById('nickname').value,
        email: document.getElementById('email_combined').value,
    };
    try {
        // 2. 최종 URL 조합 및 패치 요청
        const finalUrl = API_BASE_URL + SIGNUP_ENDPOINT;

        const response = await fetch(finalUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        // 3. 응답상태 처리
        if (response.ok) {
            statusDiv.textContent = `회원가입 성공했다는 메시지`;
            statusDiv.style.color = 'green';
            signupForm.reset();
        } else {
            const errorData = await response.json().catch(() => ({ message: `상태 코드 ${response.status} 오류`}));
            statusDiv.textContent = `가입 실패 메시지: ${errorData.message}`;
            statusDiv.style.color = 'red';
        }
    } catch (error) {
        // 4. 네트워크 / CORS 오류 처리
        console.error('Fetch 통신 오류:', error);
        statusDiv.textContent = '네트우크 오류: 8000 실행 및 CORS 설정 확인 ㄱ';
        statusDiv.style.color = 'darkred';
    }
});