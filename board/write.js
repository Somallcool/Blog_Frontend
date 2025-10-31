import { apiGet, apiPost,apiPut, apiPostJson } from "../app.js";

// 허용되는 이미지 타입
const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// ---------------------------------------------------
// 헬퍼 함수
// ---------------------------------------------------

/**
 * 사용자에게 메시지를 표시합니다. (alert 대신 사용)
 * @param {string} message - 표시할 메시지
 * @param {string} type - 'success' 또는 'error'
 */
function showMessage(message, type = 'error') {
    const statusElement = document.getElementById('status');
    if (statusElement) {
        statusElement.textContent = message;
        // Tailwaind 클래스를 사용하여 메시지 유형에 따른 스타일 변경
        statusElement.className = `mb-4 text-sm font-bold ${type === 'success' ? 'text-green-600' : 'text-red-600'}`;
    } else {
        console.warn(`[${type.toUpperCase()}] ${message}`);
    }
}

/**
 * URL에서 boardId 파라미터를 가져옵니다.
 */
function getBoardIdFromUrl(){
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

async function uploadImageToServer(file) {
    console.log(`[Server Upload Processing] 파일명: ${file.name}, 타입: ${file.type}`);
    
    const formData = new FormData();
    formData.append('file',file);

    try{
        const endpoint = '/boards/upload-image';

        // NOTE: apiPost는 FormData를 지원하며, 응답 텍스트를 반환합니다.
        const serverUrl = await apiPost(endpoint,formData); 

        console.log(`[Upload Success] 서버 URL : ${serverUrl}`);
        return serverUrl;
    }
    catch(error){
        console.error("파일 서버 업로드 실패 :",error);
        throw new Error(`파일 업로드 실패 : ${error.message || '서버 오류'}`);
    }
}

/**
 * 텍스트를 현재 커서 위치에 삽입하고 커서를 이동하며 미리보기를 업데이트합니다.
 * @param {HTMLTextAreaElement} textarea - 대상 텍스트 영역
 * @param {string} text - 삽입할 텍스트
 * @param {string} updateAction - 'insert' 또는 'replace'
 * @param {string} targetText - 'replace' 시 찾을 텍스트
 */
function updateTextareaContent(textarea, text, updateAction = 'insert', targetText = '') {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    let value = textarea.value;
    let newCursorPos = start + text.length;

    if (updateAction === 'insert') {
        value = value.substring(0, start) + text + value.substring(end);
    } else if (updateAction === 'replace' && targetText) {
        // 기존 로딩 텍스트를 찾아 대체
        const startIndex = value.indexOf(targetText);
        if (startIndex !== -1) {
            value = value.substring(0, startIndex) + text + value.substring(startIndex + targetText.length);
            newCursorPos = startIndex + text.length; // 대체된 텍스트 뒤로 커서 이동
        } else {
            // 못 찾으면 그냥 삽입 (안전 장치)
            value = value.substring(0, start) + text + value.substring(end);
            newCursorPos = start + text.length;
        }
    }
    
    textarea.value = value;
    textarea.selectionStart = textarea.selectionEnd = newCursorPos;
    textarea.focus();
    
    // 삽입/교체 후 마크다운 미리보기 업데이트를 위한 'input' 이벤트 발생
    const event = new Event('input', { bubbles: true });
    textarea.dispatchEvent(event);
}

function initializeAuthAndNickname(nicknameInput){
    const nickname = localStorage.getItem('userNickname');

    console.log('[Auth Check] Reading userNickname:', nickname);
    if(!nickname){
        console.warn('인증 토큰 또는 닉네임이 없어 로그인 페이지로 이동합니다.');
        alert('게시글 작성을 위해 로그인이 필요합니다.');
        window.location.href='../member/login/login.html';
        return false;
    }
    if(nicknameInput){
        nicknameInput.value=nickname;

        nicknameInput.readOnly = true;
        nicknameInput.classList.add('bg-gray-100','cursor=not-allowed');
    }
    return true;
}

// ---------------------------------------------------
// DOM 로드 및 이벤트 바인딩
// ---------------------------------------------------

document.addEventListener('DOMContentLoaded', async () => {
    const boardId = getBoardIdFromUrl();
    const isEditMode = boardId !== null;

    const writeform = document.getElementById('board-write-form');
    const titleInput = document.getElementById('title');
    const nicknameInput = document.getElementById('nickname');
    const categorySelect = document.getElementById('category');
    const contentTextarea = document.getElementById('content');
    const submitButton = document.getElementById('submit-button');
    const formHeader = document.getElementById('form-header');
    // const pageTitle = document.getElementById('page-title'); <-- ❌ ID가 HTML에 없으므로 제거 (null 오류 발생 원인)
    const previewDiv = document.getElementById('markdown-preview');
    const statusElement = document.getElementById('status');
    
    // 초기 상태 메시지 클리어
    if(statusElement) statusElement.textContent = '';

    if(!initializeAuthAndNickname(nicknameInput)){
        return;
    }

    const updatePreview = async (markdownText) => {
        if (!previewDiv) return;
        if (!markdownText.trim()) {
            previewDiv.innerHTML = '<p class="text-gray-400 italic">여기에 마크다운 미리보기가 표시됩니다.</p>';
            return;
        }
        try {
            // 마크다운 미리보기는 백엔드 API를 사용합니다.
            const endpoint = '/boards/markdown-preview';
            const jsonPayload = {
                markdownText: markdownText
            };
            const htmlContent = await apiPostJson(endpoint, jsonPayload);

            previewDiv.innerHTML = htmlContent;
        } catch (error) {
            console.error("마크다운 미리보기 실패 :", error);
            previewDiv.innerHTML = '<p class="text-red-500">미리보기 로딩 중 오류가 발생했습니다.</p>';
        }
    };

    if(isEditMode){
        document.title = "게시글 수정"; // ⭐ 브라우저 탭 제목 업데이트
        formHeader.textContent = "게시글 수정";
        submitButton.textContent = "수정 완료";
        submitButton.classList.remove('bg-indigo-600');
        submitButton.classList.add('bg-green-600','hover:bg-green-700');

        try{
            const article = await apiGet(`/boards/${boardId}`);

            titleInput.value = article.title || '';
            contentTextarea.value = article.content || '';
            // nicknameInput.value = article.nickname || ''; // 닉네임 로드
            categorySelect.value = article.category || 'free'; // 카테고리 로드

            updatePreview(contentTextarea.value);
        }
        catch(error){
            console.error("수정할 게시글 데이터 로드 실패 :", error);
            showMessage('게시글 정보를 불러오는데 실패했습니다. 목록으로 돌아갑니다.', 'error'); // ⭐ alert 대체
            // 잠시 메시지를 보여준 뒤, 강제 이동 (Production 환경에서는 모달 사용)
            setTimeout(() => {
                window.location.href='../index.html';
            }, 3000);
            return;
        }
    } else {
        document.title = "새 게시글 작성"; // 새 글 작성 모드일 때도 탭 제목 설정
    }

    if (contentTextarea) {
        // 초기 미리보기 설정 및 input 이벤트 리스너
        updatePreview(contentTextarea.value);

        contentTextarea.addEventListener('input', (event) => {
            updatePreview(event.target.value);
        });

        // ---------------------------------------------------
        // 드래그 앤 드롭 이미지 업로드 로직
        // ---------------------------------------------------

        // 1. dragover: 드롭 가능하도록 설정 및 하이라이트
        contentTextarea.addEventListener('dragover', (e) => {
            e.preventDefault(); 
            // 드래그 영역 하이라이트 추가
            contentTextarea.classList.add('drag-hover');
            e.dataTransfer.dropEffect = 'copy';
        });

        // 2. dragleave: 하이라이트 제거
        contentTextarea.addEventListener('dragleave', () => {
            contentTextarea.classList.remove('drag-hover');
        });

        // 3. drop: 드롭된 파일 처리
        contentTextarea.addEventListener('drop', async (e) => {
            e.preventDefault();
            contentTextarea.classList.remove('drag-hover');

            const files = e.dataTransfer.files;
            if (files.length === 0) return;

            const imageFile = files[0];
            
            if (!allowedTypes.includes(imageFile.type)) {
                showMessage(`[${imageFile.type}]은 지원하지 않는 파일 형식입니다. (JPG, PNG 등만 허용)`);
                return;
            }

            // 1. 로딩 텍스트 삽입
            const loadingText = `\n[이미지 ${imageFile.name} 업로드 중... ⏳]\n`;
            // 커서 위치에 로딩 텍스트 삽입
            updateTextareaContent(contentTextarea, loadingText, 'insert');
            
            let imageUrl = '';

            try {
                // 2. 이미지 처리 및 서버 URL 획득
                imageUrl = await uploadImageToServer(imageFile);

                // 3. 로딩 텍스트를 마크다운 구문으로 대체
                const markdownSyntax = `\n![${imageFile.name}]( ${imageUrl} )\n`;
                
                // 삽입했던 로딩 텍스트를 마크다운 구문으로 교체
                updateTextareaContent(contentTextarea, markdownSyntax, 'replace', loadingText);

            } catch (error) {
                console.error("이미지 처리 실패:", error);
                showMessage(`이미지 처리 실패: ${error.message}`, 'error');
                
                // 실패 시 로딩 텍스트를 오류 메시지로 대체
                const errorMarkdown = `\n[이미지 ${imageFile.name} 처리 실패: 서버 오류]\n`;
                updateTextareaContent(contentTextarea, errorMarkdown, 'replace', loadingText);
            }
        });
    }

    if (writeform) {
        writeform.addEventListener('submit', async (event) => {
            event.preventDefault();
            
            const data = {
                title : titleInput.value,
                nickname: nicknameInput.value, // 닉네임 필드 추가
                category: categorySelect.value, // 카테고리 필드 추가
                content : contentTextarea.value,
            };
            if(!data.title || !data.content){
                showMessage("제목과 내용을 모두 입력해주세요");
                return;
            }

            let endpoint = '';
            let apiCall;
            let successMessage='';

            if(isEditMode){
                endpoint = `/boards/${boardId}`;
                apiCall = apiPut(endpoint,data);
                successMessage = '게시글 수정이 완료되었습니다.';
            }
            else{
                // apiPost는 FormData를 받는 것으로 되어 있으나, 
                // data 객체가 단순 JSON 형태이므로 JSON으로 보낼 수 있게 수정하는 것이 합리적임.
                // 다만, 기존 apiPost는 FormData 전용이므로, 여기서는 data를 FormData로 변환하거나
                // apiPostJson을 사용하는 것이 더 좋으나, apiPost를 사용하려면 FormData로 변환해야 합니다.
                // 서버가 JSON을 받도록 가정하고 apiPostJson을 사용하도록 변경합니다.
                // NOTE: 실제 백엔드 요구사항에 따라 apiPost(FormData) 또는 apiPostJson(JSON)을 선택해야 합니다.
                
                // 현재 데이터 구조상 JSON이 합리적이므로 apiPostJson을 사용하도록 수정합니다.
                endpoint = '/boards';
                apiCall = apiPostJson(endpoint,data); // ⭐ apiPostJson 사용
                successMessage = '게시글 작성이 완료되었습니다.';
            }

            try{
                await apiCall;
                console.log(successMessage);
                showMessage(successMessage, 'success'); // ⭐ alert 대체

                // 메시지를 잠시 보여준 뒤 페이지 이동
                setTimeout(() => {
                    if(isEditMode){
                        window.location.href=`./detail.html?id=${boardId}`;
                    }
                    else{
                        // 새 글 작성 후에는 보통 작성된 게시글 상세 페이지로 이동하는 것이 일반적이지만,
                        // 임시로 인덱스로 이동합니다. 서버 응답에서 ID를 받으면 상세로 이동 가능합니다.
                        window.location.href='../index.html'; 
                    }
                }, 800);
            }
            catch(error){
                console.error("폼 제출 실패 :", error);
                showMessage(`게시글 ${isEditMode ? '수정' : '작성'} 중 오류가 발생했습니다: ${error.message}`, 'error'); // ⭐ alert 대체
            }
        });
    }
});
