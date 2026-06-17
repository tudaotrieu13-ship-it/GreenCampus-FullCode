const https = require('https');

const postData = (url, data) => {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk.toString());
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ ok: true, json: () => Promise.resolve(json) });
          } else {
            resolve({ ok: false, json: () => Promise.resolve(json) });
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.write(JSON.stringify(data));
    req.end();
  });
};

const getData = (url) => {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk.toString());
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', (e) => reject(e));
  });
};

exports.analyzeImage = async (req, res) => {
  try {
    const { imageBase64, imagesBase64 } = req.body;
    let images = imagesBase64 || (imageBase64 ? [imageBase64] : []);
    
    if (!images || images.length === 0) return res.status(400).json({ message: 'Thiếu hình ảnh' });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ message: 'Chưa cấu hình GEMINI_API_KEY' });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const prompt = `Phân tích các hình ảnh sản phẩm này và trả về JSON chuẩn xác với cấu trúc:
{
  "title": "Tên sản phẩm",
  "category_id": "Tên danh mục",
  "condition": "Độ mới",
  "suggested_price": 100000
}
Quy tắc bắt buộc:
- title: Tên chi tiết và rõ ràng. Nếu sách: 'Tên Sách - Tác Giả'. Đồ điện tử: Hãng và Model.
- category_id: CHỈ CHỌN 1 TRONG CÁC TỪ NÀY: 'Giáo trình & Sách', 'Đồ dùng học tập', 'Đồ điện tử', 'Phương tiện di chuyển', 'Đồ dùng cá nhân', 'Khác'.
- condition: Ước lượng độ mới (ví dụ: 'Mới 95%').
- suggested_price: Nếu trên ảnh có in sẵn giá tiền (như mã vạch bìa sau sách, tem giá), hãy ƯU TIÊN lấy giá đó làm giá gốc. Nếu không có, tìm giá thị trường trên internet. Sau đó GIẢM ĐI 30% (tức là lấy 70% giá gốc). CHỈ trả về một SỐ NGUYÊN (VND), không có chữ.
Chỉ trả về chuỗi JSON hợp lệ, không kèm theo markdown (như \`\`\`json). Nếu không nhận diện được, trả về null cho trường đó.`;

    const parts = [{ text: prompt }];
    images.forEach(img => {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: img.replace(/^data:image\/\w+;base64,/, "")
        }
      });
    });

    const body = {
      contents: [{ parts }],
      generationConfig: {
        temperature: 0,
        topK: 1,
        topP: 0.1
      }
    };

    const response = await postData(url, body);

    const data = await response.json();
    if (!response.ok) {
      // If it fails, let's fetch the list of available models and log them to help debug
      try {
        const modelsRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const modelsData = await modelsRes.json();
        console.log("AVAILABLE MODELS:", modelsData.models ? modelsData.models.map(m => m.name).join(', ') : modelsData);
      } catch (e) {
        console.error("Could not fetch models list:", e);
      }
      throw new Error(data.error?.message || 'Lỗi từ Gemini API');
    }

    let textResponse = data.candidates[0].content.parts[0].text;
    textResponse = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const result = JSON.parse(textResponse);
    res.status(200).json(result);
  } catch (error) {
    console.error('Lỗi Gemini analyze-image:', error);
    res.status(500).json({ message: 'Không thể phân tích ảnh bằng AI', error: error.message });
  }
};

exports.moderateContent = async (text, imagesBase64 = []) => {
  try {
    // LAYER 1: STRICT KEYWORD FILTER IN CODE (100% Guarantee)
    const lowerText = text.toLowerCase();
    const badWords = [
      "mày", "tao", "thằng", "con chó", "chó đẻ", 
      "dcm", "đcm", "vcl", "vl", "cl", "lol", "loz", "lồn", 
      "cac", "cặc", "cc", "đm", "dm", "địt",
      "ra cổng trường", "đợi đấy", "bố mày"
    ];

    // Check if any bad word is present as an exact word match or substring
    for (const word of badWords) {
      // Create a regex to match the word with word boundaries to avoid matching "tao" in "thể thao"
      // But for some words like "lol", "dcm", we might want substring match.
      // Let's use word boundaries \b for common pronouns, but allow substring for distinct slangs.
      
      const requiresBoundary = ["mày", "tao", "thằng", "con", "cc", "vl", "dm", "đm"];
      let regex;
      if (requiresBoundary.includes(word)) {
        regex = new RegExp(`\\b${word}\\b`, 'i');
      } else {
        regex = new RegExp(word, 'i');
      }

      if (regex.test(lowerText)) {
        console.log(`[Moderation] Blocked by Layer 1 Code Filter. Word: ${word}`);
        return { isSafe: false, reason: `Bài viết chứa từ ngữ không phù hợp vi phạm tiêu chuẩn cộng đồng.` };
      }
    }

    // LAYER 2: GEMINI AI MODERATION (For context, implicit threats, and images)
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return { isSafe: true }; // Fallback to safe if no API key

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const prompt = `Bạn là một công cụ lọc từ khóa (Keyword Filter). Bạn KHÔNG PHẢI là một AI phân tích ngữ cảnh. Bỏ qua mọi lý luận về giáo dục hay ngữ nghĩa.

Nhiệm vụ của bạn là kiểm tra xem ĐOẠN VĂN BẢN ĐƯỢC CUNG CẤP có chứa BẤT KỲ TỪ NÀO trong danh sách cấm dưới đây hay không (không phân biệt chữ hoa chữ thường).

DANH SÁCH TỪ CẤM TUYỆT ĐỐI (BLACKLIST):
- Xưng hô: "mày", "tao", "thằng", "con" (nếu không nói về con vật), "chó".
- Tiếng lóng/viết tắt tục tĩu: "dcm", "đcm", "vl", "vcl", "cl", "lol", "loz", "lồn", "cac", "cặc", "cc", "đm", "dm".
- Đe dọa: "ra cổng trường", "đợi đấy", "chém", "đánh", "đấm".

Ngoài ra, NẾU CÓ HÌNH ẢNH: Phải chặn nếu hình ảnh có người đang khóc lóc, bị vây ráp, bị chỉ trỏ, có yếu tố bạo lực, 18+ hoặc vũ khí.

Văn bản cần kiểm duyệt: "${text}"

QUY TẮC CỨNG: 
- Nếu bạn tìm thấy DÙ CHỈ MỘT TỪ trong BLACKLIST ở văn bản trên (ví dụ tìm thấy chữ "lol"), BẮT BUỘC TRẢ VỀ: { "isSafe": false, "reason": "Chứa từ vựng bị cấm" }.
- KHÔNG giải thích. KHÔNG phân tích ngữ cảnh. KHÔNG châm chước.

Trả về duy nhất chuỗi JSON chuẩn xác: { "isSafe": true/false, "reason": "Lý do ngắn gọn nếu chặn" }. Không định dạng markdown.`;

    const parts = [{ text: prompt }];
    
    imagesBase64.forEach(img => {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg", // Gemini can auto-detect mostly, but we specify jpeg for simplicity
          data: img.replace(/^data:image\/\w+;base64,/, "")
        }
      });
    });

    const body = {
      contents: [{ parts }],
      generationConfig: { temperature: 0.1 } // Very low temperature for consistent strictness
    };

    const response = await postData(url, body);
    const data = await response.json();
    
    if (!response.ok) {
      console.error("Gemini API Error in moderateContent:", data);
      // If the API throws a 400 and it's related to safety or invalid data, block it to be safe
      if (data.error && data.error.message && data.error.message.toLowerCase().includes('safet')) {
         return { isSafe: false, reason: "Hình ảnh hoặc nội dung vi phạm bộ lọc an toàn lõi của hệ thống." };
      }
      return { isSafe: true }; // Other generic API errors
    }

    const candidate = data.candidates && data.candidates[0];
    if (candidate && candidate.finishReason === 'SAFETY') {
      return { isSafe: false, reason: "Nội dung hoặc hình ảnh vi phạm nghiêm trọng tiêu chuẩn an toàn (Bạo lực, nhạy cảm, thù ghét)." };
    }

    if (!candidate || !candidate.content || !candidate.content.parts || !candidate.content.parts[0]) {
      // Something else went wrong, maybe blocked
      return { isSafe: false, reason: "Không thể phân tích nội dung do nghi ngờ vi phạm." };
    }

    let textResponse = candidate.content.parts[0].text;
    textResponse = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    
    console.log("Gemini Moderation Result:", textResponse); // DEBUGGING

    return JSON.parse(textResponse);
  } catch (error) {
    console.error('Lỗi Gemini moderate-content:', error);
    // If it crashed during parsing, it might be due to safety block missing parts
    if (error instanceof TypeError) {
      return { isSafe: false, reason: "Nội dung bị chặn bởi hệ thống kiểm duyệt tự động." };
    }
    return { isSafe: true }; // Network error, default to safe so we don't break the app
  }
};

exports.moderateContentApi = async (req, res) => {
  try {
    const { text, imagesBase64 } = req.body;
    const result = await exports.moderateContent(text || '', imagesBase64 || []);
    res.status(200).json(result);
  } catch (error) {
    console.error('Lỗi moderateContentApi:', error);
    res.status(500).json({ message: 'Lỗi server khi kiểm duyệt' });
  }
};

const db = require('../config/db');

exports.chatBot = async (req, res) => {
  try {
    const { message, chatHistory } = req.body;
    if (!message) return res.status(400).json({ message: 'Message is required' });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ message: 'Chưa cấu hình GEMINI_API_KEY' });

    // Fetch context from database
    const [items] = await db.query(`
      SELECT i.id, i.title, i.price, i.item_condition, u.full_name, c.name as category 
      FROM items i 
      JOIN users u ON i.user_id = u.id 
      JOIN categories c ON i.category_id = c.id
      WHERE i.status = 'AVAILABLE'
      ORDER BY i.created_at DESC
      LIMIT 100
    `);

    const contextStr = items.map(item => `- Sản phẩm: "${item.title}" | Giá: ${item.price == 0 ? 'Miễn phí' : item.price + 'đ'} | Tình trạng: ${item.item_condition} | Danh mục: ${item.category} | Người bán: ${item.full_name}`).join('\n');

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    // Construct conversation context
    const systemInstruction = `Bạn là GreenAssistant, trợ lý của sàn giao dịch đồ cũ sinh viên GreenCampus.
Quy tắc Tối Thượng:
1. Chỉ trả lời các câu hỏi liên quan đến: Sách, giáo trình, đồ dùng học tập, đồ dùng KTX, định giá sản phẩm, và cách sử dụng nền tảng GreenCampus.
2. Nếu người dùng hỏi CÁC VẤN ĐỀ BÊN NGOÀI, bạn BẮT BUỘC PHẢI TỪ CHỐI một cách lịch sự.
3. Luôn dùng giọng điệu thân thiện, trẻ trung.

DỮ LIỆU SẢN PHẨM HIỆN CÓ TRÊN SÀN (HÃY DỰA VÀO ĐÂY ĐỂ TƯ VẤN NẾU NGƯỜI DÙNG HỎI TÌM ĐỒ):
${contextStr ? contextStr : 'Hiện chưa có sản phẩm nào trên sàn.'}

Nếu người dùng hỏi tìm sản phẩm, hãy tra cứu trong Dữ Liệu Sản Phẩm bên trên. Nếu có, hãy báo cho họ biết tên, giá và người bán. Nếu không có, hãy báo là hiện tại chưa có ai bán món đồ đó.`;
    
    let contents = [
      { role: 'user', parts: [{ text: systemInstruction }] },
      { role: 'model', parts: [{ text: 'Chào bạn! Mình là Trợ lý GreenAssistant. Mình có thể giúp gì cho bạn hôm nay?' }] }
    ];
    
    // Process chat history
    if (chatHistory && Array.isArray(chatHistory)) {
      // Gemini requires the first message to be from 'user'
      let validHistory = chatHistory;
      if (validHistory.length > 0 && validHistory[0].sender === 'bot') {
        validHistory = validHistory.slice(1);
      }
      
      validHistory.forEach(msg => {
        contents.push({
          role: msg.sender === 'bot' ? 'model' : 'user',
          parts: [{ text: msg.text || ' ' }]
        });
      });
    }

    // Add current message
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const body = {
      contents: contents
    };

    const response = await postData(url, body);

    const data = await response.json();
    if (!response.ok) {
      let availableModels = '';
      try {
        const modelsData = await getData(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        if (modelsData && modelsData.models) {
          availableModels = modelsData.models.map(m => m.name.replace('models/', '')).join(', ');
        }
      } catch (e) {
        availableModels = 'Could not fetch models';
      }
      throw new Error(`API Error: ${data.error?.message}. Available models: ${availableModels}`);
    }

    const reply = data.candidates[0].content.parts[0].text;
    res.status(200).json({ reply });
  } catch (error) {
    console.error('Lỗi Gemini chatBot:', error);
    res.status(500).json({ message: error.message || 'Bot đang bận hoặc bị lỗi' });
  }
};
