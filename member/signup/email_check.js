// email_check.js (수정된 코드)

document.addEventListener('DOMContentLoaded', () => {
    // 1. 필요한 DOM 요소들을 가져옵니다.
    const emailIdInput = document.getElementById('email_id');
    const domainSelect = document.getElementById('email_domain_select');
    // ✅ 새로 추가된 요소들
    const manualInputWrapper = document.getElementById('manual-input-wrapper');
    const toggleSelectBtn = document.getElementById('toggle-select-btn'); 
    
    const domainManualInput = document.getElementById('email_domain_manual');
    const combinedEmailInput = document.getElementById('email_combined');
    const signupForm = document.getElementById('signup-form');

    // ... (updateAndValidateEmail 함수는 이전과 동일하게 유지) ...
    const updateAndValidateEmail = () => {
        const id = emailIdInput.value.trim();
        let domain = '';
        let isValid = true;

        // 보이고 있는 요소에 따라 도메인 값을 가져옴
        if (domainSelect.style.display !== 'none') {
            domain = domainSelect.value;
        } else {
            domain = domainManualInput.value.trim();
        }

        // 유효성 검사 (ID 4자 이상)
        if (id.length < 4 || !/^[a-zA-Z0-9]+$/.test(id)) {
             isValid = false;
        }
        
        // 이메일 조합 및 결과 저장
        if (id && domain && domain !== 'manual') {
            combinedEmailInput.value = `${id}@${domain}`;
        } else {
            combinedEmailInput.value = ''; 
        }

        return isValid;
    };

    /**
     * 2. 도메인 선택 박스의 변경 이벤트를 처리하는 핸들러 (수정)
     */
    domainSelect.addEventListener('change', (event) => {
        const selectedValue = event.target.value;

        if (selectedValue === 'manual') {
            // '직접입력' 선택 시: Wrapper를 보이고, Select는 숨김
            manualInputWrapper.style.display = 'flex'; // ✅ Wrapper를 flex로 보이게
            domainSelect.style.display = 'none';      // 선택 박스를 숨김
            domainManualInput.focus();
        } else {
            // 다른 도메인 선택 시
            manualInputWrapper.style.display = 'none'; // Wrapper 숨김
            domainSelect.style.display = 'block';      // 선택 박스를 보이게
        }
        
        updateAndValidateEmail();
    });

    /**
     * 3. ✅ 새로 추가된 토글 버튼 클릭 이벤트 핸들러
     * 입력 필드를 숨기고 선택 박스를 다시 보이게 합니다.
     */
    toggleSelectBtn.addEventListener('click', () => {
        manualInputWrapper.style.display = 'none'; // 직접 입력 Wrapper 숨김
        domainSelect.style.display = 'block';      // 선택 박스 보임
        domainSelect.value = 'manual';             // 선택 박스의 값을 '직접입력'으로 다시 설정
        domainSelect.focus();
        
        updateAndValidateEmail();
    });

    // 4. 입력 필드 값 변경 시 최종 이메일 주소 실시간 업데이트
    domainManualInput.addEventListener('input', updateAndValidateEmail);
    emailIdInput.addEventListener('input', updateAndValidateEmail);
    
    // (이하 폼 제출 및 초기 설정 코드는 유지)
    if (signupForm) {
        // ... (폼 제출 유효성 검사 로직 유지) ...
    }

    // 5. 초기 설정 (Wrapper를 숨기는 것으로 변경)
    manualInputWrapper.style.display = 'none'; // 초기 로딩 시 직접입력 Wrapper 숨김
    domainSelect.style.display = 'block';
    
    updateAndValidateEmail(); 
});