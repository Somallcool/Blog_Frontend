import { apiGet } from "../app.js"; // app.js에서 apiGet 함수를 직접 가져옵니다.

// DOM이 완전히 로드된 후 실행됩니다.
document.addEventListener('DOMContentLoaded', () => {
    // URL에서 ID를 추출하고 상세 정보를 불러옵니다.
    fetchBoardDetail();

    const deleteButton = document.getElementById('delete-button');
    const editButton = document.getElementById('edit-button');
    const backButton = document.getElementById('back-button');

    // 목록으로 돌아가기
    if (backButton) {
        backButton.addEventListener('click', () => {
            // index.html이 리스트 페이지라고 가정합니다.
            window.location.href = '../index.html'; 
        });
    }

    // TODO: 삭제, 수정 버튼 기능은 주석 처리된 상태로 유지합니다.
    // if (deleteButton) { deleteButton.addEventListener('click', handleDelete); }
    // if (editButton) { editButton.addEventListener('click', handleEdit); }
});

// URL에서 게시글 ID를 추출하는 함수
function getBoardIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

/**
 * 게시글 상세 정보를 API에서 가져와 화면에 표시합니다.
 */
async function fetchBoardDetail() {
    const boardId = getBoardIdFromUrl();
    // HTML 파일에 있는 오류 메시지와 로딩 메시지 ID를 사용합니다.
    const errorMessageElement = document.getElementById('error-message');
    const boardDetailContainer = document.getElementById('board-detail-container');
    
    // 1. ID 유효성 검사
    if (!boardId) {
        if (errorMessageElement) {
            errorMessageElement.textContent = "오류: 게시글 ID가 URL에 없습니다.";
            errorMessageElement.classList.remove('hidden');
        }
        return;
    }

    // 로딩 메시지 표시 (detail.html에 loading-message ID가 없으므로 container를 숨김)
    if (boardDetailContainer) boardDetailContainer.style.opacity = 0;
    if (errorMessageElement) errorMessageElement.classList.add('hidden');


    try {
        // 💡 수정: apiGet을 직접 사용하고, API_BASE_URL이 localhost:8000이므로 
        // 전체 엔드포인트 경로인 /api/v1/boards/{id}를 제공합니다.
        const board = await apiGet(`/boards/${boardId}`);
        
        // 2. API 요청 성공 및 데이터 바인딩
        if (boardDetailContainer) boardDetailContainer.style.opacity = 1;

        console.log('✅ API 요청 성공. 데이터:', board);
        
        if (board && board.boardId) {
            bindBoardData(board);
        } else {
            throw new Error('조회된 게시글 데이터가 유효하지 않습니다.');
        }

    } catch (error) {
        // 3. API 요청 실패 처리
        const status = error.status || 'Unknown'; 
        const message = error.message || '서버 응답 오류';

        console.error('❌ API GET 요청 실패:', error);

        // detail.html 구조에 맞게 오류 메시지 출력
        const errorDiv = document.getElementById('detail-content');
        if (errorDiv) {
            errorDiv.innerHTML = `<p class="text-red-500 font-bold">
                                    게시글을 불러오는 데 실패했습니다. 
                                    (상태 코드: ${status}, 메시지: ${message})
                                  </p>`;
        }
        if (boardDetailContainer) boardDetailContainer.style.opacity = 1; // 오류 메시지를 보여주기 위해 컨테이너는 유지
    }
}

/**
 * 파일 크기를 읽기 쉬운 형식으로 변환하는 헬퍼 함수
 */
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0 || bytes === null) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}


/**
 * DTO 데이터를 HTML 요소에 바인딩합니다.
 */
function bindBoardData(board) {
    // 헤더 정보 바인딩 (detail.html의 ID와 일치하도록 수정)
    document.getElementById('detail-title').textContent = board.title || '제목 없음';
    document.getElementById('detail-author').textContent = board.nickname || '익명';
    document.getElementById('detail-date').textContent = board.inputDate || 'N/A';
    document.getElementById('detail-views').textContent = board.views || 0;
    document.getElementById('detail-likes').textContent = board.likes || 0; // likes 추가

    // 💡 핵심 변경: 마크다운 렌더링 결과(HTML)를 innerHTML로 삽입합니다.
    const contentElement = document.getElementById('detail-content');
    if (contentElement) {
        contentElement.innerHTML = board.content || '<p class="text-gray-400">내용 없음</p>';
    }

    // 파일 관련 DOM 요소
    const fileInfoDiv = document.getElementById('file-info');
    const imageDisplayArea = document.getElementById('image-display-area');
    const boardImage = document.getElementById('board-image');

    // 기본적으로 이미지 미리보기 영역은 숨깁니다.
    imageDisplayArea.classList.add('hidden');

    // 파일이 첨부되었는지 확인
    if (board.filePath && board.fileOriginalName) { 
        // 파일 정보가 있을 경우의 스타일 적용
        fileInfoDiv.classList.remove('bg-gray-100', 'text-sm', 'text-gray-700'); 
        fileInfoDiv.classList.add('p-4', 'bg-blue-50', 'border', 'border-blue-200');
        
        // 파일 확장자 확인 (png 추가)
        const fileExtension = board.fileOriginalName.split('.').pop().toLowerCase();
        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension);

        // 1. 파일 다운로드 링크 정보 (이미지 여부와 상관없이 항상 표시)
        fileInfoDiv.innerHTML = `
            <div class="flex justify-between items-center">
                <span class="font-semibold text-blue-700">첨부 파일: </span>
                <a href="${board.filePath}" target="_blank" 
                    class="text-blue-500 hover:text-blue-700 hover:underline transition">
                    ${board.fileOriginalName} 
                    <span class="text-xs text-gray-500 ml-2">(${formatBytes(board.fileSize)})</span>
                </a>
            </div>
        `;

        // 2. 이미지 미리보기 (이미지인 경우에만 표시)
        if (isImage) {
            if (boardImage) {
                boardImage.src = board.filePath;
                boardImage.alt = board.fileOriginalName;
            }
            // 이미지 미리보기 영역을 보여줍니다.
            imageDisplayArea.classList.remove('hidden');
        }

    } else {
        // 파일 정보가 없을 경우의 스타일 적용
        fileInfoDiv.classList.remove('p-4', 'bg-blue-50', 'border', 'border-blue-200');
        fileInfoDiv.classList.add('bg-gray-100', 'text-sm', 'text-gray-700');
        fileInfoDiv.textContent = '첨부 파일 없음';
    }
}