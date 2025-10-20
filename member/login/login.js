const API_BASE_URL = 'http://localhost:8000/api/v1';
const LOGIN_ENDPOINT = '/login';
const loginForm = document.getElementById('login-form');
const statusDiv = document.getElementById('login-status');

loginForm.addEventListener('submit', async function(event) {
    event.preventDefault();
    
    const data = {
        username: document.getElementById('username').value,
        password: document.getElementById('password').value
    };

    if(!data.username || !data.password){
        statusDiv.textContent = '아이디와 비밀번호를 입력해주세요.';
        statusDiv.style.color = 'red';
        return;
    }

    statusDiv.textContent = '로그인 시도 중...';
    statusDiv.style.color = 'blue';

    try {
        const finalUrl = API_BASE_URL + LOGIN_ENDPOINT;

        const response = await fetch(finalUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if(response.ok) {
            const result = await response.json();

            statusDiv.textContent = `로그인 성공 ${result.username}님, 환영합니다.`;
            statusDiv.style.color = 'green';

            setTimeout(() => {
                window.location.href = '../../index.html';
            }), 1500; // 1.5초 후 이동 
        } else {
            const errorData = await response.json().catch(() => ({message: `상태 코드 ${response.status} 오류`}));
            statusDiv.textContent = `로그인 실패 ${errorData.message || '아이디 또는 비밀번호가 일치하지 않습니다.'}`;
            statusDiv.style.color = 'red';
        }

    } catch (error) {
        console.error('Fetch 통신 오류: ', error);
        statusDiv.textContent = '네트워크 오류: 백엔드 서버 실행 확인 ㄱ';
        statusDiv.style.color = 'darkred';
    }
});