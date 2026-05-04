# 1단계 : 빌드 환경( Node.js)
FROM node:20-alpine AS build-stage
WORKDIR /app
# 의존성 설치를 위해 패키지 파일 먼저 복사
COPY package*.json ./
RUN npm install
# 전체 소스 복사 후 빌드
COPY . .
RUN npm run build

# 2단계: 실행 환경 (Nginx)
FROM nginx:stable-alpine
#빌드 단계에서 생성된 static 파일들을 nginx 폴더로 복사
COPY --from=build-stage /app/dist /usr/share/nginx/html
# 뒤에서 만들 nginx 설정 파일 적용(권장)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]