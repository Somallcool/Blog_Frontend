console.log('login.js파일 로드 성공');

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
        alert('아이디와 비밀번호를 입력해주세요.')
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
            // ✅ HttpOnlu 쿠키 주고 받기: include
            // 요청 시 쿠키를 포함
            // 브라우저에서 요청을 보낼 때 해당 도메인에 저장된 쿠키를 자동으로 요청 헤더에 포함
            credentials: 'include', 
            body: JSON.stringify(data)
        });

        if(response.ok) {
            const result = await response.json();

            // HttpOnly 쿠키 사용하면 JS에서는 토큰 접근이 안댐
            // localStorage는 보안이 너무 취약함, 그래서 토큰 대신 세션이나 쿠키로 관리 해야댐
            // 해당 login.js파일은 토큰이 아니라 로그인 성공 여부만 팓단하고 페이지 이동 수행
            // localStorage.setItem('isLoggedIn', 'true');
            // localStorage.setItem('userNickname', result.nickname);
            sessionStorage.setItem('isLoggedIn', 'true');
            sessionStorage.setItem('userNickname', result.nickname);

            const userNickname = result.nickname || data.username;

            statusDiv.textContent = `로그인 성공 ${result.nickname}님, 환영합니다. 잠시 후 이동합니다.`;
            statusDiv.style.color = 'green';

            setTimeout(() => {
                window.location.href = '../../index.html';
            }, 1500); // 1.5초 후 이동 
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