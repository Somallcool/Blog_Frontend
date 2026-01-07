console.log('네이버 로그인.js 파일 로드 성공');

const NAVER_AUTH_START_ENDPOINT = 'http://localhost:8000/api/v1/oauth/naver/url';

const naverLoginbtn = document.getElementById('naver-login-btn');

if(naverLoginbtn) {
    naverLoginbtn.addEventListener('click', async function(event) {
        event.preventDefault();

        try {
            const response = await fetch(NAVER_AUTH_START_ENDPOINT);

            if(response.ok) {
                const result = await response.json();

                if(result && result.naverAuthUrl) {
                    window.location.href = result.naverAuthUrl;
                } else {
                    console.error('백엔드에서 유효한 네이버 인증 url을 못받음')
                }
            } else {
                console.error(`네이버 로그인 시작 요청 실패( 상태: ${response.status})`);
            }
        } catch (error) {
            console.error('네트워크 오류 + 백엔드 서버 접속 x: ', error);
        }
    });
}