console.log('마이페이지.js 파일 로드 성공');

const MYPAGE_API_URL = 'http://localhost:8000/api/v1/mypage';
const statusDiv = document.getElementById('status-message');
const userInfoSection = document.getElementById('user-info-section');

// HttpOnly 쿠키 사용 마이페이지 정보 요청하기
async function loadMyPageData() {
    statusDiv.textContent = '인증 정보를 확인 중입니다...';
    statusDiv.style.backgroundColor = '#d1ecf1';
    statusDiv.style.color = '#0c5460';

    try {
        const response = await fetch(MYPAGE_API_URL, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            // ✅ HttpOnly 쿠키 자동 포함 설정( 필수 )
            credentials: 'include'
        });

        if(response.ok) {
            const data = await response.json();
            displayUserInfo(data);
        } else if (response.status === 401) {
            // 인증 실패 (토큰 만료 또는 없음)
            statusDiv.textContent = '로그인 세션이 만료되었거나 로그인되어 있지 않습니다. 로그인 페이지로 이동합니다.';
            statusDiv.style.backgroundColor = '#f8d7da';
            statusDiv.style.color = '#721c24';

            // 1.5초 후 로그인 페이지로 리디렉션
            setTimeout(() => {
                window.location.href = '../../member/login/login.html';
            }, 1500);
        } else {
            // 기타 서버 오류
            const errorData = await response.json().catch(() => ({message: `상태 코드 ${response.status} 오류`}));
            statusDiv.textContent = `오류 발생: ${errorData.message || '사용자 정보를 불러올 수 없습니다.'}`;
            statusDiv.style.backgroundColor = '#f8d7da';
            statusDiv.style.color = '#721c24';
        }
    } catch (error) {
        console.error('API 호출 중 오류:', error);
        statusDiv.textContent = '네트워크 오류: 백엔드 서버 연결을 확인해주세요.';
        statusDiv.style.backgroundColor = '#f8d7da';
        statusDiv.style.color = '#721c24';
    }
}

// 서버로부터 받은 데이터 HTMㅣ 표시
function displayUserInfo(data) {
    document.getElementById('memberId').textContent = data.memberId;
    document.getElementById('username').textContent = data.username;
    document.getElementById('nickname').textContent = data.nickname;
    document.getElementById('email').textContent = data.email;
    
    // 로딩 메시지 숨기고 정보 섹션 표시
    statusDiv.style.display = 'none';
    userInfoSection.style.display = 'block';
}

// 페이지 로드 시 데이터 호출
document.addEventListener('DOMContentLoaded', loadMyPageData);