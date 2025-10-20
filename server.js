// Express 모듈과 path 모듈을 불러옵니다.
const express = require('express');
const path = require('path');
const cors = require('cors'); 
const app = express();
const PORT = 8080; // 사용자의 환경과 포트 번호를 맞춰주세요.

// 1. 미들웨어 설정 (필요한 경우)
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. 💡 핵심: 정적 파일 제공 설정 (이 한 줄이 문제를 해결합니다)
// '/upload' URL 경로로 접근했을 때, 실제 서버 프로젝트 내부의 'upload' 디렉토리와 연결합니다.
// __dirname은 현재 server.js 파일이 위치한 디렉토리를 가리킵니다.
const uploadDir = path.join(__dirname, 'upload'); 
app.use('/upload', express.static(uploadDir));
console.log(`[File Server] Serving static files from: ${uploadDir} at URL path /upload`);


// 3. (생략) 여기에 게시글 API 라우팅 코드가 포함되어야 합니다.


// 4. 서버 시작
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
});