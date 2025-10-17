const NICK_CHECK_ENDPOINT = '/check/nickname';
const nickValue = document.getElementById('nickname');
const nickCheckButton = document.getElementById('nickname_check');

let isNickAvailable = false;

nickCheckButton.addEventListener('click', async function(){
    const nick = nickValue.value;
    const nickRegex = /^.{2,8}$/;

    if (!nickRegex.test(nick)) {
        alert('닉네임은 2자 ~ 8자 이하로 입력해주세요.');
        nickValue.focus();
        return;
    }
    const finalUrl = API_BASE_URL + NICK_CHECK_ENDPOINT;

    try {
        const response = await fetch(finalUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({nick:nick})
        });

        if (response.ok) {
            alert("사용 가능한 닉네임입니다.(코드 200)");
            isNickAvailable = true;
        } else if(response.status === 409) {
            alert("이미 사용중인 닉네임입니다.(코드 409");
            isNickAvailable = false;
            nickValue.focus();
        } else {
            alert(`서버 통신 오류: 상태 코드 ${response.status}`);
        }


    } catch (error) {
        console.error('Fetch 통신 오류: ', error);
        alert("네트워크 오류: 백 8000 CORS 확인ㄱ");
        isNickAvailable =false;
    }

});