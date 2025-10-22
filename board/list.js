import { apiGet } from "../app.js"; // app.js가 상위 폴더에 있으므로 "../app.js"

let cursorId = null;
let cursorDate = null;
const pageSize = 10;
let isLoading = false;
let hasNext = true; // 다음 페이지가 있는지 여부

document.addEventListener('DOMContentLoaded',() => {
    fetchBoardList(); // 초기 데이터 로드

    window.addEventListener('scroll',() => {
        // ⭐ 수정된 로직: 로딩 중이거나 다음 페이지가 없으면(hasNext가 false면) return
        if(isLoading || !hasNext){ 
            return;
        }

        const scrollHeight = document.documentElement.scrollHeight;
        const scrollTop = document.documentElement.scrollTop;
        const clientHeight = document.documentElement.clientHeight;

        // 화면 하단에서 100px 이내로 스크롤 했을 때 다음 페이지 로드
        if(scrollTop + clientHeight >= scrollHeight - 100){
            fetchBoardList();
        }
    });

    const writeButton = document.getElementById('write-button');
    if(writeButton){
        writeButton.addEventListener('click',(e)=>{
            e.preventDefault();
            window.location.href='./board/write.html'; // board 폴더가 아닌 root의 board/write.html로 이동
        });
    }
    else{
        console.error("오류 : 'write-button' ID를 가진 요소 찾을 수 없습니다.");
    }
});

/**
 * 커서 기반으로 게시글 목록을 불러오는 함수 (무한 스크롤)
 */
async function fetchBoardList(){

    const boardContainer = document.getElementById('board-list-container');
    const loadingMessage = document.getElementById('loadingMessage');
    const errorMessage = document.getElementById('errorMessage');
    const endOfListMessage = document.getElementById('endOfListMessage');
    
    // 이중 체크: 로딩 중이거나 더 이상 데이터가 없으면 return
    if(isLoading || !hasNext) return;

    isLoading = true;
    loadingMessage.classList.remove('hidden');
    errorMessage.classList.add('hidden');
    endOfListMessage.classList.add('hidden');

    try{
        let url = `/boards/cursor?size=${pageSize}`;

        if(cursorId !==null && cursorDate !== null){
            url += `&cursorId=${cursorId}&cursorDate=${cursorDate}`;
        }

        const response = await apiGet(url);

        const boards = response.content;
        hasNext = response.hasNext;
        // ⭐ 수정됨: DTO 필드명은 일반적으로 camelCase인 nextCursorId를 사용합니다.
        cursorId = response.nextCursorId; 
        cursorDate = response.nextCursorDate;

        if(boards && boards.length > 0){
            boards.forEach(board => {
                const card = createBoardCard(board);
                boardContainer.appendChild(card);
            });
        }
        // 최초 로드 시 데이터가 없는 경우 메시지 표시
        else if (boardContainer.children.length === 0){
            boardContainer.innerHTML = '<p class="text-center text-gray-500 col-span-full py-20">등록된 게시글이 없습니다.</p>';
        }

    }
    catch(error){
        console.error('게시글 목록 조회 실패 :', error);
        errorMessage.textContent = `API 요청 실패 : ${error.message}`;
        errorMessage.classList.remove('hidden');
        hasNext = false;
    } finally{
        isLoading = false;
        loadingMessage.classList.add('hidden');

        // 모든 글을 다 불러왔을 경우 메시지 표시
        if(!hasNext && boardContainer.children.length > 0){
            endOfListMessage.classList.remove('hidden');
        }
    }
}
    
/**
 * 게시글 데이터를 사용하여 Velog 스타일의 카드(Card) 요소를 생성합니다.
 */
function createBoardCard(board) {
    const card = document.createElement('div');
    // 카드 디자인 클래스
    card.className = 'bg-white rounded-xl shadow-lg hover:shadow-xl transition duration-300 overflow-hidden cursor-pointer';

    const inputDate = new Date(board.inputDate);
    // 날짜 포맷팅
    const formattedDate = `${inputDate.getFullYear()}년 ${inputDate.getMonth() + 1}월 ${inputDate.getDate()}일`;

    // 마크다운에서 추출된 첫 번째 텍스트 블록을 요약 (HTML 태그 및 줄바꿈 제거)
    const rawContent = board.content ? board.content.replace(/<[^>]*>/g, '').trim() : '';
    const singleLineContent = rawContent.replace(/(\r\n|\n|\r)/gm, " ");
    const summaryText = singleLineContent.substring(0, 150) + (singleLineContent.length > 150 ? '...' : '');

    // 상세 페이지 링크 설정
    card.addEventListener('click', () => {
        window.location.href = `board/detail.html?id=${board.boardId}`;
    });

    card.innerHTML = `
        <div class="p-6">
            <!-- 제목 -->
            <h2 class="text-xl font-bold text-gray-900 mb-2 truncate">${board.title}</h2>
            
            <!-- 내용 요약 -->
            <p class="text-gray-600 mb-4 h-16 overflow-hidden">${summaryText || '내용 요약이 없습니다.'}</p>
            
            <!-- 하단 메타 정보 -->
            <div class="flex justify-between items-center text-sm text-gray-500 pt-4 border-t border-gray-100">
                <!-- 날짜 및 작성자 -->
                <div>
                    <span class="mr-3">${formattedDate}</span>
                    <span>by <span class="font-medium text-gray-700">${board.nickname}</span></span>
                </div>
                
                <!-- 조회수 및 좋아요 -->
                <div class="flex items-center space-x-3">
                    <span class="flex items-center">
                        <!-- Eye icon (Views) -->
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
                        </svg>
                        ${board.views || 0}
                    </span>
                    <span class="flex items-center">
                        <!-- Heart icon (Likes) -->
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd" />
                        </svg>
                        ${board.likes || 0}
                    </span>
                </div>
            </div>
        </div>
    `;
    return card;
}
