console.log('id_check.js 파일 로드 성공');
const ID_CHECK_ENDPOINT = '/check/id';
const idInput = document.getElementById('username');
const idCheckButton = document.getElementById('id_check');

let isIdAvailable = false;

idCheckButton.addEventListener('click', async function() {
    
    const id = idInput.value;
    const idRegex = /^[a-zA-Z0-9]{4,12}$/;

    if (!idRegex.test(id)) {
        alert('아이디는 4자 ~ 12자 이하의 영문자 또는 숫자만 가능합니다. ');
        idInput.focus();
        return;
    }
    const finalUrl = API_BASE_URL + ID_CHECK_ENDPOINT;

    try {
        const response = await fetch(finalUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({id: id})
        });
        
        if (response.ok) {
            alert("사용 가능한 아이디입니다.(코드 200)");
            isIdAvailable = true;
        } else if(response.status === 409){
            alert("이미 사용중인 아이디입니다.(코드 409)");
            isIdAvailable = false;
            idInput.focus();
        } else {
            alert(`서버 통신 오류: 상태 코드 ${response.status}`);
        }

    } catch (error) {
        console.error('Fetch 통신 오류: ', error);
        alert("네트워크 오류: 8000 실행 및 CORS 설정 확인이 필요합니다.");
        isIdAvailable = false;
    }

});

