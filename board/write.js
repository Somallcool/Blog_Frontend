import { apiPost, apiPostJson } from "../app.js";

// 허용되는 이미지 타입
const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// ---------------------------------------------------
// 헬퍼 함수
// ---------------------------------------------------

/**
 * 드롭된 이미지 파일을 처리하고 미리보기를 위한 임시 로컬 URL을 반환합니다.
 * * 참고: 실제 프로덕션 환경에서는 이 함수 내에서 파일을 서버에 업로드하고
 * 서버에서 반환된 영구 URL을 사용해야 합니다. 현재는 로컬 미리보기를 위해
 * 브라우저의 URL.createObjectURL을 사용하여 원본 이미지를 표시합니다.
 * * @param {File} file - 드롭된 File 객체
 * @returns {Promise<string>} - 이미지 URL (임시 로컬 URL)
 */
async function uploadImageToServer(file) {
    console.log(`[Server Upload Processing] 파일명: ${file.name}, 타입: ${file.type}`);
    
    const formData = new FormData();
    formData.append('file',file);

    try{
        const endpoint = '/boards/upload-image';

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

// ---------------------------------------------------
// DOM 로드 및 이벤트 바인딩
// ---------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    const writeform = document.getElementById('board-write-form');
    const contentTextarea = document.getElementById('content');
    const previewDiv = document.getElementById('markdown-preview');

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
                console.error(`[${imageFile.type}]은 지원하지 않는 파일 형식입니다. (JPG, PNG 등만 허용)`);
                return;
            }

            // 1. 로딩 텍스트 삽입
            const loadingText = `\n[이미지 ${imageFile.name} 업로드 중... ⏳]\n`;
            // 커서 위치에 로딩 텍스트 삽입
            updateTextareaContent(contentTextarea, loadingText, 'insert');
            
            let imageUrl = '';
            try {
                // 2. 이미지 처리 및 로컬 URL 획득 (원본 이미지 표시를 위함)
                imageUrl = await uploadImageToServer(imageFile);

                // 3. 로딩 텍스트를 마크다운 구문으로 대체
                const markdownSyntax = `\n![${imageFile.name}]( ${imageUrl} )\n`;
                
                // 삽입했던 로딩 텍스트를 마크다운 구문으로 교체
                updateTextareaContent(contentTextarea, markdownSyntax, 'replace', loadingText);

                // TODO: 실제 서버 환경에서는, 이 시점에 imageFile을 별도의 API 호출로 서버에 업로드하고,
                // 응답으로 받은 영구 URL을 markdownSyntax에 사용해야 합니다.
                
            } catch (error) {
                console.error("이미지 처리 실패:", error);
                
                // 실패 시 로딩 텍스트를 오류 메시지로 대체
                const errorMarkdown = `\n[이미지 ${imageFile.name} 처리 실패: ${error.message}]\n`;
                updateTextareaContent(contentTextarea, errorMarkdown, 'replace', loadingText);
            }
        });
    }

    if (writeform) {
        writeform.addEventListener('submit', async (event) => {
            event.preventDefault();

            const formData = new FormData(writeform);
            const endpoint = '/boards';

            for (let [key, value] of formData.entries()) {
                console.log(`${key}: ${value}`);
            }

            try {
                // apiPost 함수를 사용하여 FormData를 서버로 전송
                const resultMessage = await apiPost(endpoint, formData);

                console.log("게시글 작성 성공:", resultMessage);

                // 성공 후 목록 페이지로 리다이렉트
                alert('게시글 작성이 완료되었습니다!'); // 임시 alert
                window.location.href = '../index.html';

            } catch (error) {
                console.error("게시글 작성 실패", error);
                alert('게시글 작성 중 오류가 발생했습니다. 자세한 내용은 콘솔을 확인하세요.');
            }
        });
    }
});
