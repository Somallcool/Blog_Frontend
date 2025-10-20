function loadHtml(url, targetId) {
    fetch(url)
        .then(response => {
            if(!response.ok) {
                throw new Error('네이게이션 바 로드 실패: '+response.statusText);
            }
            return response.text();
        })
        .then(html => {
            const targetElement = document.getElementById(targetId);
            if(targetElement) {
                targetElement.innerHTML = html;
            } else {
                console.error(`대상이 되는 ID (${targetId})를 찾을 수 없습니다.`);
            }
        })
        .catch(error => {
            console.error('Error Loading navigation bar: ', error);
        });
}

document.addEventListener('DOMContentLoaded', () => {
    loadHtml('../../navbar.html', 'navbar-placeholder');
});