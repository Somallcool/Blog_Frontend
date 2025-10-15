import { createBoardPost } from "../app.js";

document.addEventListener('DOMContentLoaded',()=>{
    const writeform = document.getElementById('board-write-form');

    if(writeform){
        writeform.addEventListener('submit',async(event)=>{
            event.preventDefault();

            const formData = new FormData(writeform);

            for(let [key,value] of formData.entries()){
                console.log(`${key}: ${value}`);
            }

            try{
                const resultMessage = await createBoardPost(formData);

                alert(resultMessage);
                window.location.href='index.html';
            }catch(error){
                console.error("게시글 작성 실패",error);
            }

        });
    }
});