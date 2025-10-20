import { apiGet } from "../app.js";

document.addEventListener('DOMContentLoaded',()=>{
    fetchBoardList();

    const writeButton = document.getElementById('write-button');
    if(writeButton){
        writeButton.addEventListener('click',(e)=>{
            e.preventDefault();
            window.location.href='/board/write.html';
        });
    }
    else{
        console.error("오류 : 'write-button' ID를 가진 요소 찾을 수 없습니다.");
    }
});

async function fetchBoardList(){
    const tableBody = document.getElementById('board-list-body');
    const loadingMessage = document.getElementById('loadingMessage');
    const errorMessage = document.getElementById('errorMessage');

    if(!loadingMessage || !errorMessage){
        console.error("오류 : loadingMessage 또는 errorMessage 요소 찾을 수 없습니다.index.html의 ID를 확인하세요.");
        return;
    }
    loadingMessage.classList.remove('hidden');
    errorMessage.classList.add('hidden');
    tableBody.innerHTML = '';

    try{
        const boards = await apiGet('/boards');

        if(boards && boards.length >0){
            boards.forEach(board =>{
                const row = createBoardRow(board);
                tableBody.appendChild(row);
            });
        }
        else{

            tableBody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">등록된 게시글이 없습니다.</td></tr>';
        }
    }
    catch(error){
        console.error('게시글 목록 조회 실패 :',error);
        errorMessage.textContent = `API GET 요청 실패 ${error.message}`;
        errorMessage.classList.remove('hidden');
    }
    finally{
        loadingMessage.classList.add('hidden');
    }
};

function createBoardRow(board){
    const row = document.createElement('tr');
    row.className ='border-b hover:bg-gray-50';

    row.innerHTML=`
    <td class="px-6 py-4 text-sm text-gray-500 text-center">${board.boardId}</td>
        <td class="px-6 py-4 text-sm font-medium text-gray-900">
            <!-- 💡 상세 페이지 링크 형식 변경: detail.html?id={boardId} -->
            <a href="board/detail.html?id=${board.boardId}" class="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer">${board.title}</a>
        </td>
        <td class="px-6 py-4 text-sm text-gray-500 text-center">${board.nickname}</td>
        <td class="px-6 py-4 text-sm text-gray-500 text-center">${board.inputDate.substring(0, 10)}</td>
        <td class="px-6 py-4 text-sm text-gray-500 text-center">${board.views || 0}</td>
        <td class="px-6 py-4 text-sm text-gray-500 text-center">${board.likes || 0}</td> <!-- 💡 추천(likes) 필드 추가 -->
    `;
    return row;
}