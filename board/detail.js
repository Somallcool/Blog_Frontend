import { apiGet, apiPost, apiDelete } from "../app.js"; 


// 🚨 Firebase 관련 코드와 import를 모두 제거하고, 
// 백엔드 서버의 인증 결과(isAuthor)에만 의존합니다.

// 전역 상태 변수
let currentBoardId = null;

/**
 * 💡 [규칙 준수] 커스텀 메시지를 표시하는 헬퍼 함수
 */
function showStatusMessage(message, isError = false) {
    const msgBox = document.getElementById('like-message-box') || document.getElementById('error-message');
    if (msgBox) {
        msgBox.textContent = message;
        msgBox.classList.remove('hidden', 'text-green-500', 'text-red-500', 'text-sm');
        msgBox.classList.add(isError ? 'text-red-500' : 'text-green-500', 'text-base');
        
        setTimeout(() => {
            msgBox.classList.add('hidden');
        }, 3000);
    }
}

/**
 * 게시글 작성 권한 여부에 따라 수정/삭제 버튼의 가시성을 토글합니다.
 * @param {boolean} isAuthor - 현재 로그인한 사용자가 게시글 작성자인지 여부 (서버에서 판단)
 */
function toggleEditDeleteButtons(isAuthor) {
    const editButton = document.getElementById('edit-button');
    const deleteButton = document.getElementById('delete-button');

    // 버튼을 기본적으로 숨긴 상태에서, 작성자일 경우에만 보여줍니다.
    if (editButton) {
        editButton.classList.toggle('hidden', !isAuthor);
    }
    if (deleteButton) {
        deleteButton.classList.toggle('hidden', !isAuthor);
    }
    
    // 이 로그는 이제 서버가 판단한 최종 권한 여부만 표시합니다.
    console.log(`[권한 확인] 서버로부터 받은 작성자 권한 여부: ${isAuthor ? '있음' : '없음'}`);
    
    // 권한이 없는데 버튼이 보이려고 하는 경우에 대한 알림 (안전을 위해)
    if (!isAuthor && (editButton && !editButton.classList.contains('hidden') || deleteButton && !deleteButton.classList.contains('hidden'))) {
        showStatusMessage("⚠️ 작성자만 수정/삭제가 가능합니다.", true);
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
        let isLikedResponse = await apiPost(`/boards/${currentBoardId}/like`, {}); 
        
        let isLiked;
        if (typeof isLikedResponse === 'string') {
            isLiked = isLikedResponse.toLowerCase() === 'true';
        } else if (typeof isLikedResponse === 'boolean') {
            isLiked = isLikedResponse;
        } else {
             console.error("좋아요 토글 응답이 유효하지 않습니다:", isLikedResponse);
             showStatusMessage('좋아요 처리 응답 오류', true);
             return;
        }

        const likeCountElement = document.getElementById('detail-likes');
        const currentLikeCount = parseInt(likeCountElement.textContent, 10);
        let newLikeCount;

        if (isLiked) { 
             newLikeCount = currentLikeCount + 1;
        } else { 
            newLikeCount = Math.max(0, currentLikeCount - 1);
        }
        
        likeCountElement.textContent = newLikeCount;
        updateLikeButtonUI(isLiked); 

        const message = isLiked ? '좋아요를 눌렀습니다!' : '좋아요를 취소했습니다.';
        showStatusMessage(message);

    } catch (error) {
        console.error("좋아요 토글 실패:", error);
        showStatusMessage(`좋아요 실패: ${error.message || '서버 오류'}`, true);
    }
}

/**
 * 좋아요 버튼의 아이콘과 스타일을 업데이트합니다.
 */
function updateLikeButtonUI(isLiked) {
    const likeIcon = document.getElementById('like-icon');
    const likeButton = document.getElementById('like-button');
    const likeCountSpan = document.getElementById('detail-likes');

    if (likeIcon) {
        likeIcon.textContent = isLiked ? '❤️' : '🤍';
        likeIcon.classList.toggle('text-red-500', isLiked);
        likeIcon.classList.toggle('text-gray-400', !isLiked);
    }
    
    const likeCount = parseInt(likeCountSpan?.textContent || '0', 10);
    likeCountSpan?.classList.toggle('text-red-600', likeCount > 0);
    likeCountSpan?.classList.toggle('text-gray-700', likeCount === 0);

    likeButton?.classList.toggle('hover:bg-red-100', !isLiked);
    likeButton?.classList.toggle('hover:bg-gray-100', isLiked);
}


/**
 * 게시글 삭제를 처리합니다.
 */
async function handleDelete() {
    if (!currentBoardId) {
        showStatusMessage('삭제할 게시글 ID를 찾을 수 없습니다.', true);
        return;
    }

    try {
        // 이 API 호출은 서버의 Security 검증을 거쳐 권한이 없으면 403 Forbidden 에러가 발생해야 합니다.
        await apiDelete(`/boards/${currentBoardId}`); 
        showStatusMessage('게시글이 성공적으로 삭제되었습니다.');
        
        setTimeout(() => {
            window.location.href = '../index.html';
        }, 800);

    } catch (error) {
        // 서버에서 권한 없음(403) 에러를 보냈을 때도 처리 가능
        const errorMessage = error.status === 403 ? '권한이 없습니다. 작성자만 삭제할 수 있습니다.' : (error.message || '서버 오류');
        console.error("게시글 삭제 실패 : ", error);
        showStatusMessage(`게시글 삭제 실패: ${errorMessage}`, true);
    }
}

// DOM이 완전히 로드된 후 실행됩니다.
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Firebase 인증 초기화 과정을 생략하고 바로 게시글 ID를 확보합니다.
    currentBoardId = getBoardIdFromUrl();
    fetchBoardDetail(currentBoardId); 

    const deleteButton = document.getElementById('delete-button');
    const editButton = document.getElementById('edit-button');
    const backButton = document.getElementById('back-button');
    const likeButton = document.getElementById('like-button');

    // 이벤트 리스너 등록
    if (backButton) {
        backButton.addEventListener('click', (e) => {
            e.preventDefault(); 
            window.location.href = '../index.html'; 
        });
    }
    // 수정/삭제 버튼 리스너 
    if (editButton) {
        editButton.addEventListener('click', () => {
            if (currentBoardId) {
                // 버튼이 보이는 상태라면 권한이 있다고 서버가 확인해 준 것입니다.
                window.location.href = `../board/write.html?id=${currentBoardId}`; 
            }
        });
    }
    if (deleteButton) { 
        deleteButton.addEventListener('click', handleDelete); 
    }
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
    
    if (!boardId) {
        showStatusMessage("오류: 게시글 ID가 URL에 없습니다.", true);
        return;
    }

    if (boardDetailContainer) boardDetailContainer.style.opacity = 0;
    if (errorMessageElement) errorMessageElement.classList.add('hidden');


    try {
        // 서버에서 isAuthor 플래그를 포함한 DTO를 반환한다고 가정합니다.
        const board = await apiGet(`/boards/${boardId}`);
        
        if (boardDetailContainer) boardDetailContainer.style.opacity = 1;
        
        if (board && board.boardId) {
            bindBoardData(board);
        } else {
            throw new Error('조회된 게시글 데이터가 유효하지 않습니다.');
        }

    } catch (error) {
        const status = error.status || 'Unknown'; 
        const message = error.message || '서버 응답 오류';

        console.error('❌ API GET 요청 실패:', error);

        const errorDiv = document.getElementById('detail-content');
        if (errorDiv) {
            errorDiv.innerHTML = `<p class="text-red-500 font-bold">
                                         게시글을 불러오는 데 실패했습니다. 
                                         (상태 코드: ${status}, 메시지: ${message})
                                      </p>`;
        }
        if (boardDetailContainer) boardDetailContainer.style.opacity = 1; 
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
 * DTO 데이터를 HTML 요소에 바인딩하고 권한을 확인합니다.
 */
function bindBoardData(board) {
    
    // 1. 제목 바인딩
    const titleElement = document.getElementById('detail-title');
    if (titleElement) titleElement.textContent = board.title || '제목 없음';

    // 2. 닉네임 바인딩
    const nicknameElement = document.getElementById('detail-nickname');
    if (nicknameElement) nicknameElement.textContent = board.member?.nickname || '익명';
    
    // 3. 날짜 바인딩
    const dateElement = document.getElementById('detail-date');
    if (dateElement) dateElement.textContent = board.inputDate || 'N/A';
    
    // 4. 조회수 바인딩
    const viewsElement = document.getElementById('detail-views');
    if (viewsElement) viewsElement.textContent = board.views || 0;
    
    // 5. 좋아요 정보 바인딩 및 UI 초기화
    const likesElement = document.getElementById('detail-likes');
    if (likesElement) {
        likesElement.textContent = board.likes || 0; 
        const isLiked = board.isLikedByCurrentUser === true; 
        updateLikeButtonUI(isLiked);
    }
    
    // 6. 내용 바인딩
    const contentElement = document.getElementById('detail-content');
    if (contentElement) {
        contentElement.innerHTML = board.content || '<p class="text-gray-400">내용 없음</p>';
    }

    // 7. 파일 정보 바인딩 (기존 로직 유지)
    const fileInfoDiv = document.getElementById('file-info');
    const imageDisplayArea = document.getElementById('image-display-area');
    const boardImage = document.getElementById('board-image');

    if (imageDisplayArea) imageDisplayArea.classList.add('hidden');

    if (board.filePath && board.fileOriginalName) { 
        if (fileInfoDiv) {
            fileInfoDiv.classList.remove('bg-gray-100', 'text-sm', 'text-gray-700'); 
            fileInfoDiv.classList.add('p-4', 'bg-blue-50', 'border', 'border-blue-200');
        }
        
        const fileExtension = board.fileOriginalName.split('.').pop().toLowerCase();
        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension);

        if (fileInfoDiv) {
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
        }

        if (isImage) {
            if (boardImage) {
                boardImage.src = board.filePath;
                boardImage.alt = board.fileOriginalName;
            }
            if (imageDisplayArea) imageDisplayArea.classList.remove('hidden');
        }

    } else {
        if (fileInfoDiv) {
            fileInfoDiv.classList.remove('p-4', 'bg-blue-50', 'border', 'border-blue-200');
            fileInfoDiv.classList.add('bg-gray-100', 'text-sm', 'text-gray-700');
            fileInfoDiv.textContent = '첨부 파일 없음';
        }
    }
    
    // 8. ⭐️ 서버에서 제공하는 isAuthor 플래그를 사용하여 버튼 토글
    // 서버가 DTO에 isAuthor 필드를 담아 보냈다고 가정합니다.
    const isAuthor = board.isAuthor === true; 
    toggleEditDeleteButtons(isAuthor);
}
