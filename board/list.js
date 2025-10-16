import { fetchBoardList } from "../app.js";

document.addEventListener('DOMContentLoaded',()=>{

    const boardListContainer = document.getElementById('board-list-container');

    fetchBoardList()
        .then(boards =>{
            if(!boards || boards.length ===0){
                boardListContainer.innerHTML = '게시글이 없습니다.';
                return;
            }
            const listHtml = boards.map(board =>`
                <tr>
                    <td>${board.boardId}</td>
                    <td><a href="detail.html?id=${board.boardId}">${board.title}</a></td>
                    <td>${board.nickname}</td>
                    <td>${board.inputDate}</td>
                    <td>${board.views}</td>
                    <td>${board.likes}</td>
                </tr>
                `).join('');

                boardListContainer.innerHTML = `
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-gray-100">
                            <th class="p-3 border">번호</th>
                            <th class="p-3 border">제목</th>
                            <th class="p-3 border">작성자</th>
                            <th class="p-3 border">작성일</th>
                            <th class="p-3 border">조회</th>
                            <th class="p-3 border">추천</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${listHtml}
                    </tbody>
                </table>
                `;
        })
        .catch(error =>{
            console.error(error);
            boardListContainer.innerHTML = '<p class="text-red-600">데이터를 불러오는 데 실패했습니다.</p>';
        });
});
document.getElementById('loadingMessage').style.display = 'none';