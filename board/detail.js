import { apiGet, apiPost, apiDelete } from "../app.js"; 

// 이 변수를 전역/모듈 범위에 선언하여 모든 함수와 리스너에서 접근 가능하도록 합니다.
let currentBoardId = null;

/**
 * 💡 [규칙 준수] 커스텀 메시지를 표시하는 헬퍼 함수
 * alert/confirm 사용 불가 규정을 준수하기 위해 사용
 */
function showStatusMessage(message, isError = false) {
    const msgBox = document.getElementById('like-message-box') || document.getElementById('error-message');
    if (msgBox) {
        msgBox.textContent = message;
        msgBox.classList.remove('hidden', 'text-green-500', 'text-red-500');
        msgBox.classList.add(isError ? 'text-red-500' : 'text-green-500');
        
        // 3초 후 메시지 숨김
        setTimeout(() => {
            msgBox.classList.add('hidden');
        }, 3000);
    }
}

/**
 * 좋아요 버튼 클릭을 처리하고 상태를 토글합니다.
 */
async function handleLikeClick() {
    if (!currentBoardId) {
        showStatusMessage('오류: 게시글 ID를 찾을 수 없습니다.', true);
        return;
    }

    try {
        // 백엔드 API: POST /boards/{boardId}/like (좋아요 토글)
        // 서버가 토글 후의 최종 상태(boolean)를 반환한다고 가정합니다.
        let isLikedResponse = await apiPost(`/boards/${currentBoardId}/like`, {}); 
        
        // ⭐️ 수정된 로직: 응답이 문자열 ("true"/"false")이든, 순수 boolean이든 
        // 최종적으로 boolean 타입의 isLiked 변수에 저장합니다.
        let isLiked;
        if (typeof isLikedResponse === 'string') {
            // "true" 또는 "false" 문자열을 boolean으로 변환
            isLiked = isLikedResponse.toLowerCase() === 'true';
        } else if (typeof isLikedResponse === 'boolean') {
            // 순수 boolean인 경우 그대로 사용
            isLiked = isLikedResponse;
        } else {
             // 응답이 유효한 boolean 또는 boolean 문자열이 아닐 경우 (예외 처리)
             console.error("좋아요 토글 응답이 유효하지 않습니다:", isLikedResponse);
             showStatusMessage('좋아요 처리 응답 오류', true);
             return;
        }

        // 1. 현재 좋아요 카운트를 DOM에서 가져옵니다.
        const likeCountElement = document.getElementById('detail-likes');
        const currentLikeCount = parseInt(likeCountElement.textContent, 10);
        let newLikeCount;

        // 2. 변환된 isLiked (boolean) 상태를 바탕으로 카운트를 조정합니다.
        if (isLiked) { 
             // 최종 상태가 '좋아요' (true) -> 카운트 1 증가
             newLikeCount = currentLikeCount + 1;
        } else { 
            // 최종 상태가 '좋아요 취소' (false) -> 카운트 1 감소
            newLikeCount = Math.max(0, currentLikeCount - 1);
        }
        
        // UI 업데이트
        likeCountElement.textContent = newLikeCount;
        updateLikeButtonUI(isLiked); // 이미 불리언 타입이므로 수정 불필요

        // 메시지 출력 로직 수정 없음: isLiked 상태에 따라 메시지 출력
        const message = isLiked ? '좋아요를 눌렀습니다!' : '좋아요를 취소했습니다.';
        showStatusMessage(message);

    } catch (error) {
        console.error("좋아요 토글 실패:", error);
        showStatusMessage(`좋아요 실패: ${error.message || '서버 오류'}`, true);
    }
}

/**
 * 좋아요 버튼의 아이콘과 스타일을 업데이트합니다.
 * @param {boolean} isLiked - 현재 사용자가 좋아요를 눌렀는지 여부
 */
function updateLikeButtonUI(isLiked) {
    const likeIcon = document.getElementById('like-icon');
    const likeButton = document.getElementById('like-button');
    const likeCountSpan = document.getElementById('detail-likes');

    if (likeIcon) {
        likeIcon.textContent = isLiked ? '❤️' : '🤍'; // 아이콘 변경
        likeIcon.classList.toggle('text-red-500', isLiked);
        likeIcon.classList.toggle('text-gray-400', !isLiked);
    }
    
    // 좋아요 수가 0이 아닐 때 숫자를 빨갛게
    const likeCount = parseInt(likeCountSpan?.textContent || '0', 10);
    likeCountSpan?.classList.toggle('text-red-600', likeCount > 0);
    likeCountSpan?.classList.toggle('text-gray-700', likeCount === 0);

    // 버튼 hover 효과 변경
    likeButton?.classList.toggle('hover:bg-red-100', !isLiked);
    likeButton?.classList.toggle('hover:bg-gray-100', isLiked);
}


/**
 * 게시글 삭제를 처리합니다. (alert/confirm 사용 금지 규칙에 맞게 수정됨)
 */
async function handleDelete() {
    if (!currentBoardId) {
        console.error('삭제할 게시글 ID를 찾을 수 없습니다.');
        showStatusMessage('삭제할 게시글 ID를 찾을 수 없습니다.', true);
        return;
    }

    // 💡 [규칙 준수] window.confirm 대신, 실제 앱에서는 커스텀 모달이 필요합니다.
    // 여기서는 일단 삭제를 진행하며 콘솔에 메시지를 남깁니다.
    // TODO: 커스텀 모달 UI를 구현하여 사용자에게 삭제 확인을 받아야 합니다.
    console.warn(`[TODO: Custom Modal] ID ${currentBoardId}번 게시글을 삭제 시도합니다.`);
    
    try {
        await apiDelete(`/boards/${currentBoardId}`);
        showStatusMessage('게시글이 성공적으로 삭제되었습니다.');
        console.log('✅ 게시글 삭제 성공');
        
        setTimeout(() => {
            window.location.href = '../index.html';
        }, 800);

    } catch (error) {
        console.error("게시글 삭제 실패 : ", error);
        showStatusMessage(`게시글 삭제 실패: ${error.message || '서버 오류'}`, true);
    }
}

// DOM이 완전히 로드된 후 실행됩니다.
document.addEventListener('DOMContentLoaded', () => {
    // 1. ID를 먼저 추출하여 전역 변수에 저장
    currentBoardId = getBoardIdFromUrl();

    // 2. 상세 정보를 불러옵니다.
    fetchBoardDetail(currentBoardId); 

    const deleteButton = document.getElementById('delete-button');
    const editButton = document.getElementById('edit-button');
    const backButton = document.getElementById('back-button');
    const likeButton = document.getElementById('like-button'); // ⭐️ 추가: 좋아요 버튼

    // 목록으로 돌아가기
    if (backButton) {
        backButton.addEventListener('click', (e) => {
            e.preventDefault(); // a 태그의 기본 동작을 막고
            window.location.href = '../index.html'; // JS로 이동
        });
    }

    // 수정 버튼
    if (editButton) {
        editButton.addEventListener('click', () => {
            if (currentBoardId) {
                window.location.href = `../board/write.html?id=${currentBoardId}`; 
            } else {
                console.error("수정할 게시글 ID를 찾을 수 없습니다.");
            }
        });
    }

    // 삭제 버튼
    if (deleteButton) { 
        deleteButton.addEventListener('click', handleDelete); 
    }

    // ⭐️ 추가: 좋아요 버튼 리스너
    if (likeButton) {
        likeButton.addEventListener('click', handleLikeClick);
    }
});


// URL에서 게시글 ID를 추출하는 함수
function getBoardIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const parsedId = id ? parseInt(id, 10) : null;
    return parsedId || id; 
}

/**
 * 게시글 상세 정보를 API에서 가져와 화면에 표시합니다.
 * @param {number|string} boardId - 게시글 ID
 */
async function fetchBoardDetail(boardId) {
    const errorMessageElement = document.getElementById('error-message');
    const boardDetailContainer = document.getElementById('board-detail-container');
    
    // 1. ID 유효성 검사
    if (!boardId) {
        showStatusMessage("오류: 게시글 ID가 URL에 없습니다.", true);
        return;
    }

    // 로딩 메시지 표시 (detail.html에 loading-message ID가 없으므로 container를 숨김)
    if (boardDetailContainer) boardDetailContainer.style.opacity = 0;
    if (errorMessageElement) errorMessageElement.classList.add('hidden');


    try {
        // API 호출: /boards/{boardId}
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
    
    // 좋아요 정보 바인딩 및 UI 초기화
    document.getElementById('detail-likes').textContent = board.likes || 0; 
    // 백엔드에서 현재 사용자가 좋아요를 눌렀는지 여부를 알려주는 필드를 가정합니다.
    const isLiked = board.isLikedByCurrentUser === true; 
    updateLikeButtonUI(isLiked);


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
