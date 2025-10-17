import { apiPost, apiPostJson } from "../app.js";

document.addEventListener('DOMContentLoaded',()=>{
    const writeform = document.getElementById('board-write-form');
    const contentTextarea = document.getElementById('content');
    const previewDiv = document.getElementById('markdown-preview');

    const updatePreview = async (markdownText)=>{
        if(!previewDiv)return;
        if(!markdownText.trim()){
            previewDiv.innerHTML = '<p class="text-gray-400 italic">여기에 마크다운 미리보기가 표시됩니다.</p>';
            return;
        }
        try{
            const endpoint = '/boards/markdown-preview';
            const jsonPayload = {
                markdownText : markdownText
            };
            const htmlContent = await apiPostJson(endpoint,jsonPayload);

            previewDiv.innerHTML = htmlContent;
        }
        catch(error){
            console.error("마크다운 미리보기 실패 :", error);
            previewDiv.innerHTML='<p class="text-red-500">미리보기 로딩 중 오류가 발생했습니다.</p>';
        }
    };
    if(contentTextarea){
        updatePreview(contentTextarea.value);

        contentTextarea.addEventListener('input',(event)=>{
            updatePreview(event.target.value);
        });
    }

    if(writeform){
        writeform.addEventListener('submit',async(event)=>{
            event.preventDefault();

            const formData = new FormData(writeform);

            const endpoint = '/boards';

            for(let [key,value] of formData.entries()){
                console.log(`${key}: ${value}`);
            }

           try {
                // apiPost 함수를 사용하여 FormData를 서버로 전송
                // apiPost 함수는 endpoint와 formData를 인자로 받습니다.
                const resultMessage = await apiPost(endpoint, formData); 

                // 성공 메시지 출력 및 목록 페이지로 리다이렉트 (alert 대신 임시 콘솔 사용)
                console.log("게시글 작성 성공:", resultMessage);
                
                // alert() 대신 커스텀 메시지를 사용해야 하지만, 현재는 window.location을 바로 사용합니다.
                window.location.href = '../index.html'; 

            } catch (error) {
                console.error("게시글 작성 실패", error);
                // 실패 메시지를 사용자에게 표시
                alert('게시글 작성 중 오류가 발생했습니다. 자세한 내용은 콘솔을 확인하세요.');
            }
        });
    }
});