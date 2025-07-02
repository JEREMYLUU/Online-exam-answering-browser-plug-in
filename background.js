// 后台服务工作者
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'ping') {
    // 简单的ping测试
    sendResponse({success: true, message: 'pong', timestamp: Date.now()});
    return false; // 不需要异步响应
  }
  
  if (request.action === 'testAPI') {
    testAPIConnection(request)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({success: false, error: error.message}));
    return true; // 保持消息通道开放
  }
  
  if (request.action === 'getAnswer') {
    getAnswer(request.question, request)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({success: false, error: error.message}));
    return true; // 保持消息通道开放
  }
  
  if (request.action === 'takeScreenshot') {
    takeScreenshot()
      .then(result => sendResponse(result))
      .catch(error => sendResponse({success: false, error: error.message}));
    return true; // 保持消息通道开放
  }
  
  if (request.action === 'getAnswerFromImage') {
    getAnswerFromImage(request.imageData, request)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({success: false, error: error.message}));
    return true; // 保持消息通道开放
  }
});

// 截图功能
async function takeScreenshot() {
  try {
    // 检查权限
    if (!chrome.tabs || !chrome.tabs.query || !chrome.tabs.captureVisibleTab) {
      throw new Error('缺少必要的权限：tabs 权限。请在扩展管理页面重新加载插件。');
    }
    
    // 获取当前活动标签页
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      throw new Error('无法获取当前标签页，请确保标签页处于活动状态');
    }
    
    console.log('正在截取标签页:', tab.id, tab.url);
    
    // 直接截取当前标签页的可见内容
    const imageData = await new Promise((resolve, reject) => {
      chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png', quality: 90 }, (dataUrl) => {
        if (chrome.runtime.lastError) {
          console.error('截图错误:', chrome.runtime.lastError);
          reject(new Error(chrome.runtime.lastError.message));
        } else if (!dataUrl) {
          reject(new Error('截图失败：未获取到图像数据'));
        } else {
          console.log('截图成功，数据长度:', dataUrl.length);
          resolve(dataUrl);
        }
      });
    });
    
    return { success: true, imageData: imageData };
  } catch (error) {
    console.error('截图功能错误:', error);
    return { success: false, error: error.message };
  }
}

// API配置定义
const API_CONFIGS = {
  novita: {
    name: 'Novita AI',
    endpoint: 'https://api.novita.ai/v3/openai/chat/completions',
    headers: (apiKey) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    }),
    buildBody: (model, messages, maxTokens, temperature) => ({
      model: model,
      messages: messages,
      response_format: { type: 'text' },
      max_tokens: maxTokens,
      temperature: temperature,
      top_p: 1,
      min_p: 0,
      top_k: 50,
      presence_penalty: 0,
      frequency_penalty: 0,
      repetition_penalty: 1
    }),
    buildImageBody: (model, messages, maxTokens, temperature) => ({
      model: model,
      messages: messages,
      response_format: { type: 'text' },
      max_tokens: maxTokens,
      temperature: temperature,
      top_p: 1,
      min_p: 0,
      top_k: 50,
      presence_penalty: 0,
      frequency_penalty: 0,
      repetition_penalty: 1
    }),
    extractResponse: (data) => data.choices[0].message.content
  },
  openai: {
    name: 'OpenAI',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    headers: (apiKey) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    }),
    buildBody: (model, messages, maxTokens, temperature) => ({
      model: model,
      messages: messages,
      max_tokens: maxTokens,
      temperature: temperature
    }),
    buildImageBody: (model, messages, maxTokens, temperature) => ({
      model: model,
      messages: messages,
      max_tokens: maxTokens,
      temperature: temperature
    }),
    extractResponse: (data) => data.choices[0].message.content
  },
  anthropic: {
    name: 'Anthropic Claude',
    endpoint: 'https://api.anthropic.com/v1/messages',
    headers: (apiKey) => ({
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    }),
    buildBody: (model, messages, maxTokens, temperature) => ({
      model: model,
      messages: messages,
      max_tokens: maxTokens,
      temperature: temperature
    }),
    buildImageBody: (model, messages, maxTokens, temperature) => ({
      model: model,
      messages: messages,
      max_tokens: maxTokens,
      temperature: temperature
    }),
    extractResponse: (data) => data.content[0].text
  },
  google: {
    name: 'Google Gemini',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
    helpText: '💡 获取API Key: <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener">访问Google AI Studio</a> → 登录 → Get API key',
    defaultMaxTokens: 100,
    defaultTemperature: 0.7,
    modelsEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
    headers: (apiKey) => ({
      'Content-Type': 'application/json'
    }),
    buildBody: (model, messages, maxTokens, temperature) => {
      // 过滤掉system消息，Gemini API不支持
      const userMessages = messages.filter(msg => msg.role === 'user');
      
      return {
        contents: userMessages.map(msg => ({
          parts: [{ text: msg.content }]
        })),
        generationConfig: {
          maxOutputTokens: maxTokens,
          temperature: temperature
        }
      };
    },
    buildImageBody: (model, messages, maxTokens, temperature) => ({
      contents: messages.map(msg => ({
        parts: msg.content.map(part => {
          if (part.type === 'image') {
            return {
              inlineData: {
                mimeType: 'image/jpeg',
                data: part.imageData
              }
            };
          } else {
            return { text: part.text };
          }
        })
      })),
      generationConfig: {
        maxOutputTokens: Math.max(maxTokens, 200), // 确保至少200个token用于图片
        temperature: temperature
      }
    }),
    extractResponse: (data) => {
      if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
        return data.candidates[0].content.parts[0].text;
      } else if (data.candidates && data.candidates[0] && data.candidates[0].finishReason === 'MAX_TOKENS') {
        throw new Error('模型达到最大token限制，请减少maxOutputTokens设置');
      } else if (data.candidates && data.candidates[0] && data.candidates[0].finishReason === 'SAFETY') {
        throw new Error('内容被安全过滤器阻止');
      } else {
        console.error('Gemini API响应格式异常:', data);
        throw new Error('Gemini API响应格式异常');
      }
    },
    buildUrl: (model, apiKey) => {
      // 确保模型名称格式正确
      const cleanModel = model.replace(/^models\//, '');
      return `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${apiKey}`;
    }
  },
  custom: {
    name: '自定义API',
    endpoint: '',
    headers: (apiKey) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    }),
    buildBody: (model, messages, maxTokens, temperature) => ({
      model: model,
      messages: messages,
      max_tokens: maxTokens,
      temperature: temperature
    }),
    buildImageBody: (model, messages, maxTokens, temperature) => ({
      model: model,
      messages: messages,
      max_tokens: maxTokens,
      temperature: temperature
    }),
    extractResponse: (data) => data.choices?.[0]?.message?.content || data.content || data.text || data.response
  }
};

// 测试API连接
async function testAPIConnection(request) {
  try {
    const { apiProvider, apiKey, apiEndpoint, model, maxTokens, temperature } = request;
    
    // 验证API Key格式
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('API Key不能为空');
    }
    
    if (apiKey.length < 10) {
      throw new Error('API Key格式不正确，请检查是否完整');
    }
    
    const config = API_CONFIGS[apiProvider];
    if (!config) {
      throw new Error(`不支持的API提供商: ${apiProvider}`);
    }
    
    // 构建请求URL
    let url = apiEndpoint || config.endpoint;
    if (apiProvider === 'google') {
      url = config.buildUrl(model, apiKey.trim());
    }
    
    // 根据API提供商构建不同的测试消息
    let messages;
    if (apiProvider === 'google') {
      // Gemini API使用简单的文本消息
      messages = [
        {
          role: 'user',
          content: 'Hello, this is a test message.'
        }
      ];
    } else {
      // 其他API使用标准的role/content格式
      messages = [
        {
          role: 'system',
          content: 'Be a helpful assistant'
        },
        {
          role: 'user',
          content: 'Hello, this is a test message.'
        }
      ];
    }
    
    const body = config.buildBody(model, messages, 100, 1);
    
    console.log('测试API请求:', {
      url: url,
      provider: apiProvider,
      model: model,
      body: body
    });
    
    const response = await fetch(url, {
      method: 'POST',
      headers: config.headers(apiKey.trim()),
      body: JSON.stringify(body)
    });
    
    console.log('测试API响应状态:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('测试API错误响应:', errorText);
      
      let errorMessage = `HTTP error! status: ${response.status}`;
      
      // 针对不同错误提供详细说明
      if (response.status === 401) {
        errorMessage = `认证失败 (401): ${config.name} API Key无效或已过期。请检查：\n` +
                      '1. API Key是否正确\n' +
                      '2. API Key是否已过期\n' +
                      '3. 账户余额是否充足\n' +
                      '4. 是否在正确的API管理页面获取Key';
      } else if (response.status === 403) {
        errorMessage = `权限不足 (403): 请检查${config.name} API Key权限或账户状态`;
      } else if (response.status === 429) {
        errorMessage = '请求过于频繁 (429): 请稍后再试';
      } else if (response.status === 400) {
        errorMessage = `请求参数错误 (400): 请检查模型名称和参数设置\n\n错误详情: ${errorText}`;
      }
      
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    console.log('测试API成功响应:', data);
    return {success: true, data: data};
  } catch (error) {
    console.error('测试API失败:', error);
    return {success: false, error: error.message};
  }
}

// 获取答案
async function getAnswer(question, request) {
  try {
    const { apiProvider, apiKey, apiEndpoint, model, maxTokens, temperature } = request;
    
    // 验证API Key格式
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('API Key不能为空');
    }
    
    if (apiKey.length < 10) {
      throw new Error('API Key格式不正确，请检查是否完整');
    }
    
    const config = API_CONFIGS[apiProvider];
    if (!config) {
      throw new Error(`不支持的API提供商: ${apiProvider}`);
    }
    
    // 构建请求URL
    let url = apiEndpoint || config.endpoint;
    if (apiProvider === 'google') {
      url = config.buildUrl(model, apiKey.trim());
    }
    
    // 构建消息
    let messages;
    if (apiProvider === 'google') {
      // Gemini API不支持system消息，将system内容合并到user消息中
      const systemContent = '你是一个专业的答题助手。请根据用户提供的题目，给出准确、详细的答案。如果是选择题，请说明选择的原因；如果是计算题，请给出详细的解题步骤；如果是问答题，请给出完整的答案。每次回答先把题目和答案先显示出来。';
      messages = [
        {
          role: 'user',
          content: `${systemContent}\n\n题目：${question}`
        }
      ];
    } else {
      // 其他API使用标准的role/content格式
      messages = [
        {
          role: 'system',
          content: '你是一个专业的答题助手。请根据用户提供的题目，给出准确、详细的答案。如果是选择题，请说明选择的原因；如果是计算题，请给出详细的解题步骤；如果是问答题，请给出完整的答案。每次回答先把题目和答案先显示出来。'
        },
        {
          role: 'user',
          content: question
        }
      ];
    }
    
    // 构建请求体
    const body = config.buildBody(model, messages, maxTokens, temperature);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: config.headers(apiKey.trim()),
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      
      // 针对不同错误提供详细说明
      if (response.status === 401) {
        errorMessage = `认证失败 (401): ${config.name} API Key无效或已过期。请检查：\n` +
                      '1. API Key是否正确\n' +
                      '2. API Key是否已过期\n' +
                      '3. 账户余额是否充足\n' +
                      '4. 是否在正确的API管理页面获取Key';
      } else if (response.status === 403) {
        errorMessage = `权限不足 (403): 请检查${config.name} API Key权限或账户状态`;
      } else if (response.status === 429) {
        errorMessage = '请求过于频繁 (429): 请稍后再试';
      } else if (response.status === 400) {
        errorMessage = `请求参数错误 (400): 请检查模型名称和参数设置`;
      }
      
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    const answer = config.extractResponse(data);
    
    return {
      success: true, 
      answer: answer,
      usage: data.usage || {}
    };
  } catch (error) {
    return {success: false, error: error.message};
  }
}

// 从图片获取答案
async function getAnswerFromImage(imageData, request) {
  try {
    const { apiProvider, apiKey, apiEndpoint, model, maxTokens, temperature } = request;
    
    // 验证API Key格式
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('API Key不能为空');
    }
    
    if (apiKey.length < 10) {
      throw new Error('API Key格式不正确，请检查是否完整');
    }
    
    const config = API_CONFIGS[apiProvider];
    if (!config) {
      throw new Error(`不支持的API提供商: ${apiProvider}`);
    }
    
    // 检查API是否支持图片输入
    if (!isImageSupported(apiProvider, model)) {
      throw new Error('当前选择的API模型不支持图片输入，请选择支持图片的模型');
    }
    
    // 构建请求URL
    let url = apiEndpoint || config.endpoint;
    if (apiProvider === 'google') {
      url = config.buildUrl(model, apiKey.trim());
    }
    
    // 处理图片数据
    const processedImageData = processImageData(imageData, apiProvider);
    
    // 构建消息
    const messages = buildImageMessages(apiProvider, processedImageData);
    
    // 构建请求体
    const body = config.buildImageBody(model, messages, maxTokens, temperature);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: config.headers(apiKey.trim()),
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      
      // 针对不同错误提供详细说明
      if (response.status === 401) {
        errorMessage = `认证失败 (401): ${config.name} API Key无效或已过期。请检查：\n` +
                      '1. API Key是否正确\n' +
                      '2. API Key是否已过期\n' +
                      '3. 账户余额是否充足\n' +
                      '4. 是否在正确的API管理页面获取Key';
      } else if (response.status === 403) {
        errorMessage = `权限不足 (403): 请检查${config.name} API Key权限或账户状态`;
      } else if (response.status === 429) {
        errorMessage = '请求过于频繁 (429): 请稍后再试';
      } else if (response.status === 400) {
        errorMessage = `请求参数错误 (400): 请检查模型名称和参数设置`;
      }
      
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    const answer = config.extractResponse(data);
    
    return {
      success: true, 
      answer: answer,
      usage: data.usage || {}
    };
  } catch (error) {
    return {success: false, error: error.message};
  }
}

// 检查API是否支持图片输入
function isImageSupported(apiProvider, model) {
  // 动态检查模型是否支持图片
  const imageKeywords = ['vision', 'gpt-4o', 'gpt-4o-mini', 'claude-3', 'gemini-1.5', 'gemini-2.0', 'gemini-2.5', 'minimax'];
  
  // 检查模型名称是否包含图片支持的关键词
  const modelLower = model.toLowerCase();
  return imageKeywords.some(keyword => modelLower.includes(keyword.toLowerCase()));
}

// 处理图片数据
function processImageData(imageData, apiProvider) {
  // 移除data:image/png;base64,前缀
  const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
  
  if (apiProvider === 'google') {
    return base64Data;
  }
  
  return imageData;
}

// 构建图片消息
function buildImageMessages(apiProvider, imageData) {
  const systemMessage = '你是一个专业的答题助手。请仔细分析图片中的题目，并给出详细的解答。如果是选择题，请说明选择的原因；如果是计算题，请给出详细的解题步骤；如果是问答题，请给出完整的答案。每次回答先把题目和答案先显示出来。';
  
  if (apiProvider === 'openai') {
    return [
      {
        role: 'system',
        content: systemMessage
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: '请分析这张图片中的题目并给出详细解答。每次回答先把题目和答案先显示出来。'
          },
          {
            type: 'image_url',
            image_url: {
              url: imageData
            }
          }
        ]
      }
    ];
  } else if (apiProvider === 'anthropic') {
    return [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: systemMessage + '\n\n请分析这张图片中的题目并给出详细解答。每次回答先把题目和答案先显示出来。'
          },
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/png',
              data: imageData.replace(/^data:image\/[a-z]+;base64,/, '')
            }
          }
        ]
      }
    ];
  } else if (apiProvider === 'google') {
    return [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: systemMessage + '\n\n请分析这张图片中的题目并给出详细解答。每次回答先把题目和答案先显示出来。'
          },
          {
            type: 'image',
            imageData: imageData.replace(/^data:image\/[a-z]+;base64,/, '')
          }
        ]
      }
    ];
  } else {
    // 默认处理
    return [
      {
        role: 'system',
        content: systemMessage
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: '请分析这张图片中的题目并给出详细解答。每次回答先把题目和答案先显示出来。'
          },
          {
            type: 'image_url',
            image_url: {
              url: imageData
            }
          }
        ]
      }
    ];
  }
} 