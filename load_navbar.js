console.log('load_navbar.js 파일 로드 성공');

const LOGOUT_API_URL = 'http://localhost:8000/api/v1/logout';

// [수정] 로그아웃 버튼 클릭 시 서버에 쿠키 삭제 요청을 보냅니다.
function handleLogout(event) {
    event.preventDefault();
    
    // 서버에 로그아웃 요청을 보내 HttpOnly 쿠키를 무효화(삭제)합니다.
    fetch(LOGOUT_API_URL, {
        method: 'POST',
        credentials: 'include' // 쿠키를 서버에 보내 무효화 요청
    })
    .catch(error => {
        // 서버 요청 실패 시(네트워크 오류 등)에도 UI는 로그아웃 상태로 전환해야 함
        console.error("로그아웃 요청 중 오류 발생:", error);
    })
    .finally(() => {
        // 변경: localStorage 대신 sessionStorage에서 UI 상태 제거
        sessionStorage.removeItem('isLoggedIn');
        sessionStorage.removeItem('userNickname'); 
        // 기존 localStorage는 URL에서 토큰 가져오는 로직 때문에 겹쳐서 삭제
        localStorage.removeItem('jwtToken'); 
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userNickname'); 
        
        alert('로그아웃되었습니다.'); 
        
        // 메인 화면으로 리디렉션하여 UI를 초기화
        window.location.href = '/index.html'; 
    });
}

function updateNavbarUI() {
    const navLinksContainer = document.querySelector('.nav-links');

    if(!navLinksContainer) {
        console.error('Placeholder ( .nav-links )를 찾을 수 없습니다.');
        return;
    }
    const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
    const userNickname = sessionStorage.getItem('userNickname');

    // const ROOT_PATH = '/Blog_Frontend';
    let path = window.location.pathname;
    const pathPrefix = path.includes('/member/') || path.includes('/board/') ? '../..' : '.';

    const homeLink = `<li><a href="${pathPrefix}/index.html">홈</a></li>`;
    const contactLink = '<li><a href="#">문의</a></li>';

    let userStatusLinks;

    if(isLoggedIn && userNickname) {
        // 로그인 했을 때 닉네임,로그아웃
        userStatusLinks = `
            <li class="user-greeting"><span>${userNickname}님, 반갑습니다.</span></li>
            <li><a href="${pathPrefix}/member/mypage/mypage.html" id="mypage">마이페이지</a></li>
            <li><a href="#" id="logout-button">로그아웃</a></li>
        `;
    } else {
        // 로그아웃 했을 때 회원가입, 로그인
        userStatusLinks = `
            <li><a href="${pathPrefix}/member/signup/signup.html">회원가입</a></li>
            <li><a href="${pathPrefix}/member/login/login.html">로그인</a></li>
        `;
    }

    navLinksContainer.innerHTML = homeLink + userStatusLinks + contactLink;

    if(isLoggedIn) {
        const logoutButton = document.getElementById('logout-button');
        if(logoutButton) {
            logoutButton.addEventListener('click', handleLogout);
        }
    }
}

function loadHtml(url, targetId) {
    fetch(url)
        .then(response => {
            if(!response.ok) {
                throw new Error(`네이게이션 바 로드 실패 (URL: ${url}): `+response.statusText);
            }
            return response.text();
        })
        .then(html => {
            const targetElement = document.getElementById(targetId);
            if(targetElement) {
                targetElement.innerHTML = html;

                // HTML 로드 후에 UI업뎃함수 호출
                updateNavbarUI();

            } else {
                console.error(`대상이 되는 ID (${targetId})를 찾을 수 없습니다.`);
            }
        })
        .catch(error => {
            console.error('Error Loading navigation bar: ', error);
        });
}

document.addEventListener('DOMContentLoaded', () => {
    // 1. URL에서 토큰 확인
    const urlParams = new URLSearchParams(window.location.search);
    const jwtToken = urlParams.get('token');
    const userNickname = urlParams.get("nickname"); // URL에서 닉네임 파라미터 가져오기

    if (jwtToken&& userNickname) {
        // 2. 토큰을 localStorage에 저장 (후속 API 요청에 사용)
        sessionStorage.setItem('jwtToken', jwtToken);

        // 3. 네비게이션바 업데이트를 위한 localStorage 값 설정
        // updateNavbarUI가 사용할 닉네임 값을 여기에 설정합니다.
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('userNickname', userNickname);

        // 4. URL 정리 (히스토리에서 ?token=... 제거)
        window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    // 5. 네비게이션 바 로드 (토큰 처리 후)
    let path = window.location.pathname;
    let navbarPath = path.includes('/member/') ? '../../navbar.html' : 'navbar.html';
    loadHtml(navbarPath, 'navbar-placeholder');
});
