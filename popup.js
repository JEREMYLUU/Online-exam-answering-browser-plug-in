// 弹出窗口的JavaScript逻辑
document.addEventListener('DOMContentLoaded', function() {
  // 初始化API配置
  initAPIConfig();
  
  // 加载保存的设置
  loadSettings();
  
  // 绑定事件监听器
  document.getElementById('saveSettings').addEventListener('click', saveSettings);
  document.getElementById('testAPI').addEventListener('click', testAPI);
  document.getElementById('apiProvider').addEventListener('change', updateAPIConfig);
  document.getElementById('apiKey').addEventListener('input', debounce(checkAPIAndLoadModels, 1000));
  document.getElementById('apiEndpoint').addEventListener('input', debounce(checkAPIAndLoadModels, 1000));
  document.getElementById('model').addEventListener('change', updateModelInfo);
  document.getElementById('temperature').addEventListener('input', updateTempValue);
});

// 防抖函数
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// API配置定义
const API_CONFIGS = {
  novita: {
    name: 'Novita AI',
    endpoint: 'https://api.novita.ai/v3/openai/chat/completions',
    helpText: '💡 获取API Key: <a href="https://novita.ai/" target="_blank" rel="noopener">访问Novita AI官网</a> → 注册/登录 → API管理 → 创建新的API Key',
    defaultMaxTokens: 20000,
    defaultTemperature: 0.7,
    modelsEndpoint: null // 使用默认端点
  },
  openai: {
    name: 'OpenAI',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    helpText: '💡 获取API Key: <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener">访问OpenAI平台</a> → 登录 → API Keys → Create new secret key',
    defaultMaxTokens: 4000,
    defaultTemperature: 0.7,
    modelsEndpoint: 'https://api.openai.com/v1/models'
  },
  anthropic: {
    name: 'Anthropic Claude',
    endpoint: 'https://api.anthropic.com/v1/messages',
    helpText: '💡 获取API Key: <a href="https://console.anthropic.com/" target="_blank" rel="noopener">访问Anthropic控制台</a> → 登录 → API Keys → Create Key',
    defaultMaxTokens: 4000,
    defaultTemperature: 0.7,
    modelsEndpoint: null // Anthropic不提供模型列表API
  },
  google: {
    name: 'Google Gemini',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
    helpText: '💡 获取API Key: <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener">访问Google AI Studio</a> → 登录 → Get API key',
    defaultMaxTokens: 100,
    defaultTemperature: 0.7,
    modelsEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models'
  },
  custom: {
    name: '自定义API',
    endpoint: '',
    helpText: '💡 请输入您的自定义API配置信息',
    defaultMaxTokens: 2000,
    defaultTemperature: 0.7,
    modelsEndpoint: null
  }
};

// 预设的模型信息（用于无法动态获取的情况）
const PRESET_MODELS = {
  openai: [
    { id: 'gpt-4-vision-preview', name: 'GPT-4 Vision', supportsImage: true },
    { id: 'gpt-4o', name: 'GPT-4o', supportsImage: true },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', supportsImage: true },
    { id: 'gpt-4', name: 'GPT-4', supportsImage: false },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', supportsImage: false },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', supportsImage: false }
  ],
  anthropic: [
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', supportsImage: true },
    { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', supportsImage: true },
    { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', supportsImage: true }
  ],
  google: [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', supportsImage: true },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', supportsImage: true },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', supportsImage: true },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', supportsImage: true },
    { id: 'gemini-pro', name: 'Gemini Pro', supportsImage: false }
  ],
  novita: [
    { id: 'minimaxai/minimax-m1-80k', name: 'Minimax M1-80K', supportsImage: true },
    { id: 'minimaxai/minimax-m1-32k', name: 'Minimax M1-32K', supportsImage: true },
    { id: 'minimaxai/minimax-m1-8k', name: 'Minimax M1-8K', supportsImage: true }
  ]
};

// 初始化API配置
function initAPIConfig() {
  const providerSelect = document.getElementById('apiProvider');
  const endpointInput = document.getElementById('apiEndpoint');
  const maxTokensInput = document.getElementById('maxTokens');
  const temperatureInput = document.getElementById('temperature');
  const tempValueSpan = document.getElementById('tempValue');
  
  // 初始化温度滑块显示
  updateTempValue();
  
  // 为每个API提供商添加选项
  Object.keys(API_CONFIGS).forEach(provider => {
    const option = document.createElement('option');
    option.value = provider;
    option.textContent = API_CONFIGS[provider].name;
    providerSelect.appendChild(option);
  });
  
  // 设置默认选择
  providerSelect.value = 'novita';
  updateAPIConfig();
}

// 更新API配置
function updateAPIConfig() {
  const provider = document.getElementById('apiProvider').value;
  const config = API_CONFIGS[provider];
  
  if (!config) return;
  
  // 更新端点
  document.getElementById('apiEndpoint').value = config.endpoint;
  
  // 清空模型列表
  const modelSelect = document.getElementById('model');
  modelSelect.innerHTML = '<option value="">请先配置API Key</option>';
  
  // 更新模型信息
  updateModelInfo();
  
  // 更新帮助文本
  const apiKeyHelp = document.getElementById('apiKeyHelp');
  apiKeyHelp.innerHTML = config.helpText;
  
  // 更新默认参数
  document.getElementById('maxTokens').value = config.defaultMaxTokens;
  document.getElementById('temperature').value = config.defaultTemperature;
  updateTempValue();
  
  // 如果已有API Key，尝试加载模型
  const apiKey = document.getElementById('apiKey').value;
  if (apiKey && apiKey.trim().length > 10) {
    checkAPIAndLoadModels();
  }
}

// 检查API并加载模型列表
async function checkAPIAndLoadModels() {
  const provider = document.getElementById('apiProvider').value;
  const apiKey = document.getElementById('apiKey').value;
  const apiEndpoint = document.getElementById('apiEndpoint').value;
  
  if (!apiKey || apiKey.trim().length < 10) {
    return;
  }
  
  const modelSelect = document.getElementById('model');
  modelSelect.innerHTML = '<option value="">正在加载模型列表...</option>';
  
  try {
    const models = await loadModelsFromAPI(provider, apiKey, apiEndpoint);
    populateModelSelect(models);
  } catch (error) {
    console.error('加载模型失败:', error);
    
    // 显示详细错误信息
    let errorMessage = '加载模型列表失败';
    if (error.message.includes('401')) {
      errorMessage = 'API Key无效或已过期，请检查您的API Key';
    } else if (error.message.includes('403')) {
      errorMessage = 'API Key权限不足，请检查账户状态';
    } else if (error.message.includes('429')) {
      errorMessage = '请求过于频繁，请稍后再试';
    } else if (error.message.includes('400')) {
      errorMessage = '请求参数错误，请检查API配置';
    } else if (error.message.includes('fetch')) {
      errorMessage = '网络连接失败，请检查网络连接';
    } else {
      errorMessage = `加载失败: ${error.message}`;
    }
    
    // 使用预设模型作为备选
    const presetModels = PRESET_MODELS[provider] || [];
    if (presetModels.length > 0) {
      console.log('使用预设模型作为备选');
      populateModelSelect(presetModels);
      showStatus(`模型加载失败，已使用预设模型。错误: ${errorMessage}`, 'error');
    } else {
      modelSelect.innerHTML = '<option value="">加载失败，请检查API配置</option>';
      showStatus(errorMessage, 'error');
    }
  }
}

// 从API加载模型列表
async function loadModelsFromAPI(provider, apiKey, apiEndpoint) {
  const config = API_CONFIGS[provider];
  
  if (!config.modelsEndpoint) {
    // 如果没有模型端点，使用预设模型
    return PRESET_MODELS[provider] || [];
  }
  
  let url = config.modelsEndpoint;
  
  // 构建请求头
  const headers = {
    'Content-Type': 'application/json'
  };
  
  // 根据提供商设置认证头
  if (provider === 'openai') {
    headers['Authorization'] = `Bearer ${apiKey}`;
  } else if (provider === 'google') {
    // Gemini API需要将API Key作为URL参数
    url = `${config.modelsEndpoint}?key=${apiKey}`;
  } else if (provider === 'anthropic') {
    headers['x-api-key'] = apiKey;
    headers['anthropic-version'] = '2023-06-01';
  } else {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }
  
  try {
    console.log(`正在请求 ${provider} 模型列表:`, url);
    console.log(`请求头:`, headers);
    console.log(`API Key 长度:`, apiKey.length);
    console.log(`API Key 前缀:`, apiKey.substring(0, 4));
    
    const response = await fetch(url, {
      method: 'GET',
      headers: headers
    });
    
    console.log(`${provider} API响应状态:`, response.status);
    console.log(`${provider} API响应头:`, Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`${provider} API错误响应:`, errorText);
      
      // 针对400错误提供更详细的诊断信息
      if (response.status === 400) {
        let diagnosticInfo = `400错误诊断信息:\n`;
        diagnosticInfo += `- 提供商: ${provider}\n`;
        diagnosticInfo += `- URL: ${url}\n`;
        diagnosticInfo += `- API Key长度: ${apiKey.length}\n`;
        diagnosticInfo += `- API Key前缀: ${apiKey.substring(0, 4)}\n`;
        
        if (provider === 'google') {
          diagnosticInfo += `- 可能原因:\n`;
          diagnosticInfo += `  1. API Key格式错误（应以AIza开头）\n`;
          diagnosticInfo += `  2. API Key未启用或已过期\n`;
          diagnosticInfo += `  3. 未在Google Cloud Console启用Generative Language API\n`;
          diagnosticInfo += `  4. 账户配额不足\n`;
        }
        
        console.error(diagnosticInfo);
        throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}\n\n${diagnosticInfo}`);
      }
      
      throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`${provider} API响应数据:`, data);
    
    return parseModelsFromResponse(provider, data);
  } catch (error) {
    console.error(`加载 ${provider} 模型失败:`, error);
    throw error;
  }
}

// 解析API响应中的模型列表
function parseModelsFromResponse(provider, data) {
  const models = [];
  
  switch (provider) {
    case 'openai':
      if (data.data && Array.isArray(data.data)) {
        data.data.forEach(model => {
          const supportsImage = model.id.includes('vision') || 
                               model.id.includes('gpt-4o') || 
                               model.id.includes('gpt-4o-mini');
          models.push({
            id: model.id,
            name: model.id,
            supportsImage: supportsImage
          });
        });
      }
      break;
      
    case 'google':
      console.log('解析Google Gemini模型数据:', data);
      // Gemini API可能返回不同的格式
      if (data.models && Array.isArray(data.models)) {
        data.models.forEach(model => {
          const supportsImage = model.name.includes('vision') || 
                               model.name.includes('1.5-pro') || 
                               model.name.includes('1.5-flash') ||
                               model.name.includes('2.0') ||
                               model.name.includes('2.5') ||
                               model.name.includes('ultra');
          
          // 修正模型名称格式
          let correctedName = model.name;
          
          // 如果模型名称包含完整路径，提取模型ID
          if (correctedName.includes('/')) {
            correctedName = correctedName.split('/').pop();
          }
          
          // 确保模型名称格式正确
          if (!correctedName.startsWith('models/')) {
            correctedName = `models/${correctedName}`;
          }
          
          models.push({
            id: correctedName,
            name: model.name,
            originalName: model.name,
            correctedName: correctedName,
            supportsImage: supportsImage
          });
        });
      } else if (data.data && Array.isArray(data.data)) {
        // 另一种可能的响应格式
        data.data.forEach(model => {
          const supportsImage = model.name.includes('vision') || 
                               model.name.includes('1.5-pro') || 
                               model.name.includes('1.5-flash') ||
                               model.name.includes('2.0') ||
                               model.name.includes('2.5') ||
                               model.name.includes('ultra');
          
          // 修正模型名称格式
          let correctedName = model.name;
          
          if (correctedName.includes('/')) {
            correctedName = correctedName.split('/').pop();
          }
          
          if (!correctedName.startsWith('models/')) {
            correctedName = `models/${correctedName}`;
          }
          
          models.push({
            id: correctedName,
            name: model.name,
            originalName: model.name,
            correctedName: correctedName,
            supportsImage: supportsImage
          });
        });
      } else {
        console.warn('未识别的Google Gemini响应格式:', data);
      }
      break;
      
    case 'anthropic':
      // Anthropic不提供模型列表API，使用预设
      return PRESET_MODELS.anthropic || [];
      
    case 'novita':
      // Novita AI使用预设模型
      return PRESET_MODELS.novita || [];
      
    case 'custom':
      // 自定义API，返回空列表
      return [];
  }
  
  console.log(`解析到 ${models.length} 个模型:`, models);
  return models;
}

// 填充模型选择框
function populateModelSelect(models) {
  const modelSelect = document.getElementById('model');
  modelSelect.innerHTML = '';
  
  if (models.length === 0) {
    modelSelect.innerHTML = '<option value="">未找到可用模型</option>';
    return;
  }
  
  // 按支持图片的模型优先排序
  const sortedModels = models.sort((a, b) => {
    if (a.supportsImage && !b.supportsImage) return -1;
    if (!a.supportsImage && b.supportsImage) return 1;
    return a.name.localeCompare(b.name);
  });
  
  sortedModels.forEach(model => {
    const option = document.createElement('option');
    option.value = model.id;
    option.textContent = model.name + (model.supportsImage ? ' 📷' : '');
    modelSelect.appendChild(option);
  });
  
  // 选择第一个模型
  if (sortedModels.length > 0) {
    modelSelect.value = sortedModels[0].id;
    updateModelInfo();
  }
}

// 更新模型信息
function updateModelInfo() {
  const provider = document.getElementById('apiProvider').value;
  const model = document.getElementById('model').value;
  const modelSelect = document.getElementById('model');
  const modelInfo = document.getElementById('modelInfo');
  
  if (!model || model === '') {
    modelInfo.textContent = '';
    return;
  }
  
  // 检查是否为支持图片的模型
  const selectedOption = modelSelect.querySelector(`option[value="${model}"]`);
  const supportsImage = selectedOption && selectedOption.textContent.includes('📷');
  
  let infoText = '';
  if (supportsImage) {
    infoText = '支持图片输入，可用于截图识题功能';
  } else {
    infoText = '仅支持文本输入，可用于文本选择功能';
  }
  
  modelInfo.textContent = infoText;
}

// 更新温度值显示
function updateTempValue() {
  const tempInput = document.getElementById('temperature');
  const tempValue = document.getElementById('tempValue');
  tempValue.textContent = tempInput.value;
}

// 加载设置
function loadSettings() {
  // 检查扩展是否仍然有效
  if (!chrome.storage || !chrome.storage.sync) {
    showStatus('扩展上下文已失效，请刷新页面', 'error');
    return;
  }
  
  chrome.storage.sync.get([
    'apiProvider', 'apiKey', 'apiEndpoint', 'model', 'maxTokens', 
    'temperature', 'showFloatingIcon'
  ], function(result) {
    if (chrome.runtime.lastError) {
      const error = chrome.runtime.lastError;
      if (error.message.includes('Extension context invalidated')) {
        showStatus('扩展已重新加载，请刷新页面', 'error');
      } else {
        showStatus('加载设置失败: ' + error.message, 'error');
      }
      return;
    }
    
    // 加载API提供商
    if (result.apiProvider) {
      document.getElementById('apiProvider').value = result.apiProvider;
      updateAPIConfig();
    }
    
    // 加载其他设置
    if (result.apiKey) {
      document.getElementById('apiKey').value = result.apiKey;
    }
    if (result.apiEndpoint) {
      document.getElementById('apiEndpoint').value = result.apiEndpoint;
    }
    if (result.maxTokens) {
      document.getElementById('maxTokens').value = result.maxTokens;
    }
    if (result.temperature) {
      document.getElementById('temperature').value = result.temperature;
      updateTempValue();
    }
    if (result.showFloatingIcon !== undefined) {
      document.getElementById('showFloatingIcon').checked = result.showFloatingIcon;
    }
    
    // 如果有API Key，加载模型列表
    if (result.apiKey && result.apiKey.trim().length > 10) {
      setTimeout(() => {
        checkAPIAndLoadModels();
      }, 500);
    }
    
    // 加载模型（在模型列表加载完成后）
    if (result.model) {
      setTimeout(() => {
        document.getElementById('model').value = result.model;
        updateModelInfo();
      }, 1000);
    }
  });
}

// 保存设置
function saveSettings() {
  const apiProvider = document.getElementById('apiProvider').value;
  const apiKey = document.getElementById('apiKey').value;
  const apiEndpoint = document.getElementById('apiEndpoint').value;
  const model = document.getElementById('model').value;
  const maxTokens = parseInt(document.getElementById('maxTokens').value);
  const temperature = parseFloat(document.getElementById('temperature').value);
  const showFloatingIcon = document.getElementById('showFloatingIcon').checked;
  
  // 检查扩展是否仍然有效
  if (!chrome.storage || !chrome.storage.sync) {
    showStatus('扩展上下文已失效，请刷新页面', 'error');
    return;
  }
  
  chrome.storage.sync.set({
    apiProvider: apiProvider,
    apiKey: apiKey,
    apiEndpoint: apiEndpoint,
    model: model,
    maxTokens: maxTokens,
    temperature: temperature,
    showFloatingIcon: showFloatingIcon
  }, function() {
    if (chrome.runtime.lastError) {
      const error = chrome.runtime.lastError;
      if (error.message.includes('Extension context invalidated')) {
        showStatus('扩展已重新加载，请刷新页面', 'error');
      } else {
        showStatus('保存失败: ' + error.message, 'error');
      }
    } else {
      showStatus('设置已保存', 'success');
      
      // 通知content script更新设置
      if (chrome.tabs && chrome.tabs.query) {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          if (chrome.runtime.lastError) {
            // 忽略标签页查询错误
            return;
          }
          if (tabs && tabs[0] && chrome.tabs.sendMessage) {
            chrome.tabs.sendMessage(tabs[0].id, {
              action: 'updateSettings',
              settings: {
                apiProvider, apiKey, apiEndpoint, model, maxTokens, 
                temperature, showFloatingIcon
              }
            });
          }
        });
      }
    }
  });
}

// 测试API连接
function testAPI() {
  const apiProvider = document.getElementById('apiProvider').value;
  const apiKey = document.getElementById('apiKey').value;
  const apiEndpoint = document.getElementById('apiEndpoint').value;
  const model = document.getElementById('model').value;
  const maxTokens = parseInt(document.getElementById('maxTokens').value);
  const temperature = parseFloat(document.getElementById('temperature').value);
  
  if (!apiKey) {
    showStatus('请先输入API Key', 'error');
    return;
  }
  
  if (!model) {
    showStatus('请先选择模型', 'error');
    return;
  }
  
  showStatus('正在测试API连接...', 'success');
  
  // 检查扩展是否仍然有效
  if (!chrome.runtime || !chrome.runtime.sendMessage) {
    showStatus('扩展上下文已失效，请刷新页面', 'error');
    return;
  }
  
  // 发送测试请求到background script
  chrome.runtime.sendMessage({
    action: 'testAPI',
    apiProvider: apiProvider,
    apiKey: apiKey,
    apiEndpoint: apiEndpoint,
    model: model,
    maxTokens: maxTokens,
    temperature: temperature
  }, function(response) {
    if (chrome.runtime.lastError) {
      const error = chrome.runtime.lastError;
      if (error.message.includes('Extension context invalidated')) {
        showStatus('扩展已重新加载，请刷新页面', 'error');
      } else {
        showStatus('API连接失败: ' + error.message, 'error');
      }
    } else if (response.success) {
      showStatus('API连接成功！', 'success');
    } else {
      showStatus('API连接失败: ' + response.error, 'error');
    }
  });
}

// 显示状态信息
function showStatus(message, type) {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = message;
  statusDiv.className = 'status ' + type;
  statusDiv.style.display = 'block';
  
  // 3秒后自动隐藏
  setTimeout(function() {
    statusDiv.style.display = 'none';
  }, 3000);
} 