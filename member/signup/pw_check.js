const pwValue = document.getElementById('password');
const pwCheckValue = document.getElementById('password_check');
const pwMatchMessage = document.getElementById('pw-match-message');

/*
const나 let은 지역변수가 됨
window. 은 isPwMatched를 전역변수로 바꿈
모든 스크립트 파일이 공유하는 전역 공간에 배치됨
이렇게 써야 이제 회원가입.js에서 가져가서 쓸 수 있게 됨
*/
window.isPwMatched = false;

const pwRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.*[a-zA-Z0-9!@#$%^&*]).{4,}$/;
/*

^	시작 문자열
(?=.*[A-Z])	대문자 포함	문자열 전체에서 대문자가 최소 한 개 있는지 확인함
(?=.*[!@#$%^&*]) 특수문자 포합 문자열 전체에서 지정된 특수문자 중 최소 한 개 있는지 확인합
(?=.*[a-zA-Z0-9!@#$%^&*]) 문자 집합 비밀번호에 사용될 수 있는 문자 종류를 정의함 (이 조건 없어도 아래 .{8,}이 충분히 걸러줌.)
.{8,} 길이 제한 문자열의 길이가 최소 8자 이상인지 확인함
$ 끝 문자열

*/

function updatePwMatchStatus(){
    const pw = pwValue.value;
    const pwcheck = pwCheckValue.value;

    // 유효성 검사 일치하지 않을 때
    if (!pwRegex.test(pw)) {
        pwMatchMessage.textContent = '비밀번호는 8자 이상, 대문자/특수문자를 포함해야 합니다.';
        pwMatchMessage.style.color = 'orange';
        window.isPwMatched = false;
        return;
    }

    // 비밀번호 확인란 입력 안 했으면
    if(pwcheck.length === 0){
        pwMatchMessage.textContent = '비밀번호 확인란을 입력해 않습니다.';
        pwMatchMessage.style.color = '#555';
        window.isPwMatched = false;

    // 비밀번호랑 비번확인이 일치하면
    } else if(pw === pwcheck) {
        pwMatchMessage.textContent = '비밀번호가 일치합니다.';
        pwMatchMessage.style.color = 'green';
        window.isPwMatched = true;

    } else { // 나머지는 일치 ㄴㄴ
        pwMatchMessage.textContent = '비밀번호가 일치하지 않습니다.';
        pwMatchMessage.style.color = 'red';
        window.isPwMatched = false;
    }
}
// 비밀번호, 비번확인에서 input 이벤트가 발생하면 바로 위에 것들이 실행되는것 
pwValue.addEventListener('input', updatePwMatchStatus);
pwCheckValue.addEventListener('input', updatePwMatchStatus);