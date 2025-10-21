console.log('load_navbar.js 파일 로드 성공');

function handleLogout(event) {
    event.preventDefault();
    
    // ⭐️ 핵심: localStorage에서 인증 정보 제거
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userNickname'); 
    
    alert('로그아웃되었습니다.'); 
    
    // 메인 화면으로 리디렉션하여 UI를 초기화
    window.location.href = '/Blog_Frontend/index.html'; 
}

function updateNavbarUI() {
    const navLinksContainer = document.querySelector('.nav-links');

    if(!navLinksContainer) {
        console.error('Placeholder ( .nav-links )를 찾을 수 없습니다.');
        return;
    }
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const userNickname = localStorage.getItem('userNickname');

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
  // 현재 경로의 깊이에 따라 navbar.html 경로 조정
  let path = window.location.pathname;

  // member 하위 폴더라면 ../.. 추가
  let navbarPath = path.includes('/member/') ? '../../navbar.html' : 'navbar.html';

  loadHtml(navbarPath, 'navbar-placeholder');
});
