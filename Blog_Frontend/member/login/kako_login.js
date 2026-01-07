console.log('카카오 로그인.js 파일 로드 성공');
// Security 필터 통과 후 KakaoController에서 로직 처리
const KAKAO_AUTH_START_ENDPOINT = 'http://localhost:8000/api/v1/oauth/kakao/url';

const kakaoLoginbtn = document.getElementById('kakao-login-btn');

if(kakaoLoginbtn) {
    kakaoLoginbtn.addEventListener('click', async function(event) {
        event.preventDefault();

        try {
            const response = await fetch(KAKAO_AUTH_START_ENDPOINT);

            if (response.ok) {
                // json으로 응답 받음
                const result = await response.json();

                // 조건문이 참이 될 때까지가 인증 시작 URL 요청의 범위임
                if(result && result.kakaoAuthUrl) {
                    // 카카오 로그인 버튼 클릭 후 동의항목 화면으로 이동하는 것
                    // redirect_uri(http://localhost:8000/login/oauth2/code/kakao) 정보가 포함됨
                    window.location.href = result.kakaoAuthUrl;
                } else {
                    console.error('백엔드에서 유효한 카카오 인증 url 못 받음');
                }
            } else {
                console.error(`카카오 로그인 시작 요청 실패( 상태: ${response.status})`);
            }
        } catch (error) {
            console.error('네트워크 오류 & 백엔드 서버 접속 X: ', error);
        }
    });
}