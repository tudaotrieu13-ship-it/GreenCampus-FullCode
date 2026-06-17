require('dotenv').config();
const aiController = require('./src/controllers/aiController');

async function test() {
    const text = "Thằng Tuấn lớp IT1 là một thằng , chiều nay ra cổng trường tao.";
    
    // Just a tiny valid 1x1 pixel JPEG
    const base64Img = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";
    
    const result = await aiController.moderateContent(text, [base64Img]);
    console.log("Result:", result);
}

test();
