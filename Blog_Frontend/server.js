// Express 모듈과 path 모듈을 불러옵니다.
const express = require('express');
const path = require('path');
const cors = require('cors'); 
const app = express();
const PORT = 8080; // 사용자의 환경과 포트 번호를 맞춰주세요.

// ===============================================
// 💡 인메모리 데이터베이스 (서버 실행 시 초기화됨)
// ===============================================
let currentId = 3;
let boards = [
    { id: 1, title: '첫 번째 게시글', content: '내용입니다. 수정 불필요.', author: '익명1', createdAt: new Date().toISOString() },
    { id: 2, title: '두 번째 게시글 (수정 대상)', content: '이 게시글을 수정해보세요.', author: '익명2', createdAt: new Date().toISOString() },
];
// ===============================================


// 1. 미들웨어 설정
app.use(cors());
app.use(express.json()); // JSON 형식 요청 본문 파싱
app.use(express.urlencoded({ extended: true })); // URL 인코딩된 요청 본문 파싱

// 2. 정적 파일 제공 설정
const uploadDir = path.join(__dirname, 'upload'); 
app.use('/upload', express.static(uploadDir));
console.log(`[File Server] Serving static files from: ${uploadDir} at URL path /upload`);


// ==========================================================
// 3. 게시글 API 라우팅 코드 (인증 없음: 모든 요청 허용)
// ==========================================================
const API_BASE_URL = '/api/v1/boards';

/**
 * [GET] /api/v1/boards
 * 모든 게시글 목록을 조회합니다.
 */
app.get(API_BASE_URL, (req, res) => {
    console.log(`[GET ${API_BASE_URL}] 모든 게시글 목록 조회`);
    // 최신 글이 위로 오도록 역순 정렬하여 응답
    const sortedBoards = [...boards].sort((a, b) => b.id - a.id);
    res.status(200).json(sortedBoards);
});

/**
 * [GET] /api/v1/boards/:id
 * 특정 게시글 상세 내용을 조회합니다. (403 에러가 났던 바로 그 라우트)
 */
app.get(`${API_BASE_URL}/:id`, (req, res) => {
    const id = parseInt(req.params.id);
    console.log(`[GET ${API_BASE_URL}/${id}] 게시글 상세 조회 요청`);

    const board = boards.find(b => b.id === id);

    if (board) {
        // 성공적으로 데이터를 찾으면 200 OK 응답
        res.status(200).json(board);
    } else {
        // 데이터가 없으면 404 Not Found 응답
        res.status(404).json({ message: "게시글을 찾을 수 없습니다." });
    }
});

/**
 * [POST] /api/v1/boards
 * 새로운 게시글을 작성합니다.
 */
app.post(API_BASE_URL, (req, res) => {
    const { title, content, author = '익명 작성자' } = req.body;
    console.log(`[POST ${API_BASE_URL}] 게시글 작성 요청. 제목: ${title}`);

    if (!title || !content) {
        return res.status(400).json({ message: "제목과 내용은 필수 입력 항목입니다." });
    }

    const newBoard = {
        id: currentId++,
        title,
        content,
        author,
        createdAt: new Date().toISOString()
    };

    boards.push(newBoard);
    // 201 Created 응답과 함께 새로 생성된 객체를 반환
    res.status(201).json(newBoard);
});

/**
 * [PUT] /api/v1/boards/:id
 * 특정 게시글 내용을 수정합니다.
 */
app.put(`${API_BASE_URL}/:id`, (req, res) => {
    const id = parseInt(req.params.id);
    const { title, content } = req.body;
    console.log(`[PUT ${API_BASE_URL}/${id}] 게시글 수정 요청. 새 제목: ${title}`);

    const boardIndex = boards.findIndex(b => b.id === id);

    if (boardIndex === -1) {
        return res.status(404).json({ message: "수정할 게시글을 찾을 수 없습니다." });
    }
    
    // 데이터 업데이트
    boards[boardIndex] = {
        ...boards[boardIndex],
        title: title || boards[boardIndex].title,
        content: content || boards[boardIndex].content,
        updatedAt: new Date().toISOString()
    };

    // 200 OK 응답과 함께 수정된 객체를 반환
    res.status(200).json(boards[boardIndex]);
});


/**
 * [DELETE] /api/v1/boards/:id
 * 특정 게시글을 삭제합니다.
 */
app.delete(`${API_BASE_URL}/:id`, (req, res) => {
    const id = parseInt(req.params.id);
    console.log(`[DELETE ${API_BASE_URL}/${id}] 게시글 삭제 요청`);

    const initialLength = boards.length;
    // 해당 ID를 제외한 새로운 배열로 업데이트
    boards = boards.filter(b => b.id !== id);

    if (boards.length < initialLength) {
        // 성공적으로 삭제되었으면 204 No Content 응답 (본문 없음)
        res.status(204).send(); 
    } else {
        // 삭제할 게시글을 찾지 못했으면 404 Not Found
        res.status(404).json({ message: "삭제할 게시글을 찾을 수 없습니다." });
    }
});


// 4. 서버 시작
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log(`게시판 API 경로: ${API_BASE_URL}`);
});
