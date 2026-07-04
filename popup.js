// 弹出窗口的JavaScript逻辑
document.addEventListener('DOMContentLoaded', function() {
  // 初始化API配置
  initAPIConfig();
  
  // 加载保存的设置
  loadSettings();
  
  // 绑定事件监听器
  document.getElementById('saveSettings').addEventListener('click', saveSettings);
  document.getElementById('testTextAPI').addEventListener('click', testTextAPI);
  document.getElementById('testImageAPI').addEventListener('click', testImageAPI);
  document.getElementById('apiProvider').addEventListener('change', updateAPIConfig);
  document.getElementById('apiKey').addEventListener('input', debounce(checkAPIAndLoadModels, 1000));
  document.getElementById('apiEndpoint').addEventListener('input', debounce(checkAPIAndLoadModels, 1000));
  document.getElementById('model').addEventListener('change', updateModelInfo);
  document.getElementById('modelManual').addEventListener('input', updateModelInfo);
  document.getElementById('temperature').addEventListener('input', updateTempValue);
  document.getElementById('imageApiProvider').addEventListener('change', updateImageAPIConfig);
  document.getElementById('imageApiKey').addEventListener('input', debounce(checkImageAPIAndLoadModels, 1000));
  document.getElementById('imageApiEndpoint').addEventListener('input', debounce(checkImageAPIAndLoadModels, 1000));
  document.getElementById('imageModel').addEventListener('change', updateImageModelInfo);
  document.getElementById('imageModelManual').addEventListener('input', updateImageModelInfo);
  document.getElementById('imageTemperature').addEventListener('input', updateImageTempValue);
  
  // 教程按钮
  document.getElementById('openOptions').addEventListener('click', function() {
    chrome.tabs.create({ url: 'options.html' });
  });

  document.getElementById('openTutorial').addEventListener('click', function() {
    chrome.tabs.create({ url: 'tutorial.html' });
  });
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

function getSelectedOrManualModel(selectId, manualId) {
  const manualValue = document.getElementById(manualId).value.trim();
  return manualValue || document.getElementById(selectId).value;
}

function restoreModelSelection(selectId, manualId, modelId, updateFn) {
  if (!modelId) return;
  
  const select = document.getElementById(selectId);
  const existsInSelect = Array.from(select.options).some(option => option.value === modelId);
  
  if (existsInSelect) {
    select.value = modelId;
    document.getElementById(manualId).value = '';
  } else {
    document.getElementById(manualId).value = modelId;
  }
  
  updateFn();
}

// API配置定义
const API_CONFIGS = {
  novita: {
    name: 'MegaLLM',
    endpoint: 'https://ai.megallm.io/v1/chat/completions',
    helpText: '💡 获取API Key: <a href="https://megallm.io/" target="_blank">MegaLLM官网</a>。如果想先免费试用，建议优先选择上方带“🆓”的平台。',
    defaultMaxTokens: 1500,
    defaultTemperature: 0.7,
    modelsEndpoint: 'https://ai.megallm.io/v1/models' 
  },
  deepseek: {
    name: 'DeepSeek',
    endpoint: 'https://api.deepseek.com/chat/completions',
    helpText: '💡 获取API Key: <a href="https://platform.deepseek.com/" target="_blank">DeepSeek 开放平台</a>。文本搜题成本低；截图识题建议选择支持图片的免费额度平台。',
    defaultMaxTokens: 1500,
    defaultTemperature: 1.0, // DeepSeek 推荐默认温度
    modelsEndpoint: 'https://api.deepseek.com/models'
  },
  openai: {
    name: 'OpenAI',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    helpText: '💡 获取API Key: <a href="https://platform.openai.com/api-keys" target="_blank">OpenAI Platform</a>',
    defaultMaxTokens: 1500,
    defaultTemperature: 0.7,
    modelsEndpoint: 'https://api.openai.com/v1/models'
  },
  anthropic: {
    name: 'Anthropic Claude',
    endpoint: 'https://api.anthropic.com/v1/messages',
    helpText: '💡 获取API Key: <a href="https://console.anthropic.com/" target="_blank">Anthropic Console</a>',
    defaultMaxTokens: 1500,
    defaultTemperature: 0.7,
    modelsEndpoint: null // Anthropic不提供模型列表API
  },
  google: {
    name: 'Google Gemini (免费额度优先)',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
    helpText: '🆓 推荐：Gemini API 提供 Free Tier，适合先免费测试截图识题。获取API Key: <a href="https://aistudio.google.com/app/apikey" target="_blank">Google AI Studio</a>',
    defaultMaxTokens: 2500,
    defaultTemperature: 0.7,
    modelsEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models'
  },
  openrouter: {
    name: 'OpenRouter (免费模型优先)',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    helpText: '🆓 推荐：OpenRouter 可选择免费模型或 openrouter/free 路由，适合一个 Key 试多家模型。获取API Key: <a href="https://openrouter.ai/settings/keys" target="_blank">OpenRouter Keys</a>',
    defaultMaxTokens: 1500,
    defaultTemperature: 0.7,
    modelsEndpoint: 'https://openrouter.ai/api/v1/models'
  },
  siliconflow: {
    name: 'SiliconFlow 硅基流动 (免费模型优先)',
    endpoint: 'https://api.siliconflow.cn/v1/chat/completions',
    helpText: '🆓 推荐：硅基流动提供免费模型，国内访问友好；免费模型可能有固定限流。获取API Key: <a href="https://cloud.siliconflow.cn/account/ak" target="_blank">SiliconFlow API Keys</a>',
    defaultMaxTokens: 1500,
    defaultTemperature: 0.7,
    modelsEndpoint: 'https://api.siliconflow.cn/v1/models'
  },
  qwen: {
    name: '阿里云百炼 / 通义千问 (新人免费额度)',
    endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    helpText: '🆓 推荐：阿里云百炼新用户通常有免费额度，适合国内用户先试 Qwen / Qwen-VL。获取API Key: <a href="https://bailian.console.aliyun.com/?apiKey=1" target="_blank">阿里云百炼 API Key</a>',
    defaultMaxTokens: 1500,
    defaultTemperature: 0.7,
    modelsEndpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/models'
  },
  moonshot: {
    name: 'Moonshot / Kimi',
    endpoint: 'https://api.moonshot.cn/v1/chat/completions',
    helpText: '💡 获取API Key: <a href="https://platform.moonshot.cn/console/api-keys" target="_blank">Moonshot 控制台</a>',
    defaultMaxTokens: 1500,
    defaultTemperature: 0.7,
    modelsEndpoint: 'https://api.moonshot.cn/v1/models'
  },
  zhipu: {
    name: '智谱 GLM',
    endpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    helpText: '💡 获取API Key: <a href="https://bigmodel.cn/usercenter/proj-mgmt/apikeys" target="_blank">智谱开放平台 API Keys</a>',
    defaultMaxTokens: 1500,
    defaultTemperature: 0.7,
    modelsEndpoint: 'https://open.bigmodel.cn/api/paas/v4/models'
  },
  volcengine: {
    name: '火山方舟 / 豆包',
    endpoint: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
    helpText: '💡 获取API Key: <a href="https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey" target="_blank">火山方舟 API Key</a>',
    defaultMaxTokens: 1500,
    defaultTemperature: 0.7,
    modelsEndpoint: 'https://ark.cn-beijing.volces.com/api/v3/models'
  },
  minimax: {
    name: 'MiniMax',
    endpoint: 'https://api.minimaxi.com/v1/chat/completions',
    helpText: '💡 获取API Key: <a href="https://platform.minimaxi.com/user-center/basic-information/interface-key" target="_blank">MiniMax API Key</a>',
    defaultMaxTokens: 1500,
    defaultTemperature: 0.7,
    modelsEndpoint: 'https://api.minimaxi.com/v1/models'
  },
  groq: {
    name: 'Groq (免费试用 / 文本高速)',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    helpText: '🆓 推荐：Groq 适合免费试用和高速文本搜题；截图识题请选支持图片的模型。获取API Key: <a href="https://console.groq.com/keys" target="_blank">Groq API Keys</a>',
    defaultMaxTokens: 1500,
    defaultTemperature: 0.7,
    modelsEndpoint: 'https://api.groq.com/openai/v1/models'
  },
  xai: {
    name: 'xAI',
    endpoint: 'https://api.x.ai/v1/chat/completions',
    helpText: '💡 获取API Key: <a href="https://console.x.ai/" target="_blank">xAI Console</a>',
    defaultMaxTokens: 1500,
    defaultTemperature: 0.7,
    modelsEndpoint: 'https://api.x.ai/v1/models'
  },
  mistral: {
    name: 'Mistral AI (Free mode)',
    endpoint: 'https://api.mistral.ai/v1/chat/completions',
    helpText: '🆓 推荐：Mistral La Plateforme 有 Free mode，可先试文本和 Pixtral 视觉模型。获取API Key: <a href="https://console.mistral.ai/api-keys/" target="_blank">Mistral API Keys</a>',
    defaultMaxTokens: 1500,
    defaultTemperature: 0.7,
    modelsEndpoint: 'https://api.mistral.ai/v1/models'
  },
  custom: {
    name: '自定义API',
    endpoint: '',
    helpText: '💡 请输入您的自定义API配置信息',
    defaultMaxTokens: 1500,
    defaultTemperature: 0.7,
    modelsEndpoint: null
  }
};

// 预设的模型信息
const PRESET_MODELS = {
  openai: [
    { id: 'gpt-4o', name: 'GPT-4o', supportsImage: true },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', supportsImage: true },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', supportsImage: false },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', supportsImage: false }
  ],
  deepseek: [
    { id: 'deepseek-chat', name: 'DeepSeek V3 (Chat)', supportsImage: false },
    { id: 'deepseek-reasoner', name: 'DeepSeek R1 (Reasoning)', supportsImage: false }
  ],
  anthropic: [
    { id: 'claude-3-5-sonnet-20240620', name: 'Claude 3.5 Sonnet', supportsImage: true },
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', supportsImage: true },
    { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', supportsImage: true },
    { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', supportsImage: true }
  ],
  google: [
    { id: 'gemini-2.5-flash', name: '🆓 Gemini 2.5 Flash (免费额度优先)', supportsImage: true },
    { id: 'gemini-2.5-flash-lite', name: '🆓 Gemini 2.5 Flash Lite (低成本)', supportsImage: true },
    { id: 'gemini-1.5-flash', name: '🆓 Gemini 1.5 Flash (兼容备用)', supportsImage: true }
  ],
  novita: [
    { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1', supportsImage: false },
    { id: 'deepseek/deepseek-v3', name: 'DeepSeek V3', supportsImage: false },
    { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', supportsImage: false }
  ],
  openrouter: [
    { id: 'openrouter/free', name: '🆓 OpenRouter Free Router (自动免费模型)', supportsImage: true },
    { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', supportsImage: true },
    { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', supportsImage: true }
  ],
  siliconflow: [
    { id: 'Qwen/Qwen2.5-VL-72B-Instruct', name: '🆓 Qwen2.5-VL 72B (免费模型 / 截图优先)', supportsImage: true },
    { id: 'deepseek-ai/DeepSeek-R1', name: '🆓 DeepSeek R1 (文本推理)', supportsImage: false },
    { id: 'deepseek-ai/DeepSeek-V3', name: '🆓 DeepSeek V3 (文本)', supportsImage: false }
  ],
  qwen: [
    { id: 'qwen-vl-plus', name: '🆓 Qwen VL Plus (新人免费额度 / 截图优先)', supportsImage: true },
    { id: 'qwen-plus', name: '🆓 Qwen Plus (新人额度 / 文本)', supportsImage: false },
    { id: 'qwen-turbo', name: '🆓 Qwen Turbo (新人额度 / 低成本)', supportsImage: false }
  ],
  moonshot: [
    { id: 'moonshot-v1-8k', name: 'Moonshot v1 8K', supportsImage: false },
    { id: 'moonshot-v1-32k', name: 'Moonshot v1 32K', supportsImage: false },
    { id: 'moonshot-v1-128k', name: 'Moonshot v1 128K', supportsImage: false }
  ],
  zhipu: [
    { id: 'glm-4-flash', name: 'GLM-4 Flash', supportsImage: false },
    { id: 'glm-4', name: 'GLM-4', supportsImage: false },
    { id: 'glm-4v', name: 'GLM-4V', supportsImage: true }
  ],
  volcengine: [
    { id: 'doubao-seed-1-6-flash-250615', name: 'Doubao Seed 1.6 Flash', supportsImage: false },
    { id: 'doubao-seed-1-6-thinking-250615', name: 'Doubao Seed 1.6 Thinking', supportsImage: false },
    { id: 'doubao-1-5-vision-pro-250328', name: 'Doubao Vision Pro', supportsImage: true }
  ],
  minimax: [
    { id: 'MiniMax-M3', name: 'MiniMax M3', supportsImage: true },
    { id: 'MiniMax-M2.7', name: 'MiniMax M2.7', supportsImage: false },
    { id: 'MiniMax-M2.5', name: 'MiniMax M2.5', supportsImage: false }
  ],
  groq: [
    { id: 'llama-3.3-70b-versatile', name: '🆓 Llama 3.3 70B Versatile (免费试用 / 文本高速)', supportsImage: false },
    { id: 'meta-llama/llama-4-scout-17b-16e-instruct', name: '🆓 Llama 4 Scout (支持图片)', supportsImage: true },
    { id: 'qwen/qwen3-32b', name: '🆓 Qwen3 32B (文本)', supportsImage: false }
  ],
  xai: [
    { id: 'grok-3', name: 'Grok 3', supportsImage: false },
    { id: 'grok-3-mini', name: 'Grok 3 Mini', supportsImage: false },
    { id: 'grok-2-vision-1212', name: 'Grok 2 Vision', supportsImage: true }
  ],
  mistral: [
    { id: 'pixtral-large-latest', name: '🆓 Pixtral Large Latest (Free mode / 截图)', supportsImage: true },
    { id: 'mistral-small-latest', name: '🆓 Mistral Small Latest (Free mode / 文本)', supportsImage: false },
    { id: 'mistral-large-latest', name: 'Mistral Large Latest', supportsImage: false }
  ]
};

// 初始化API配置
function initAPIConfig() {
  const providerSelect = document.getElementById('apiProvider');
  
  // 检查是否已有选项，避免重复添加
  if (providerSelect.options.length > 0) {
    // 仅更新显示逻辑
  }

  // 设置默认值
  updateAPIConfig();
  updateImageAPIConfig();
}

// 更新API配置
function updateAPIConfig() {
  const provider = document.getElementById('apiProvider').value;
  const config = API_CONFIGS[provider];
  
  if (!config) return;
  
  // 更新端点
  const endpointInput = document.getElementById('apiEndpoint');
  endpointInput.value = config.endpoint;
  
  // 自定义API允许编辑端点，其他推荐只读（但也允许改）
  // endpointInput.readOnly = provider !== 'custom';
  
  // 清空模型列表
  const modelSelect = document.getElementById('model');
  modelSelect.innerHTML = '<option value="">请先配置API Key</option>';
  document.getElementById('modelTags').innerHTML = '';
  
  // 更新模型信息
  updateModelInfo();
  
  // 更新帮助文本
  const apiKeyHelp = document.getElementById('apiKeyHelp');
  apiKeyHelp.innerHTML = config.helpText;
  
  // 更新默认参数
  document.getElementById('maxTokens').value = config.defaultMaxTokens;
  document.getElementById('temperature').value = config.defaultTemperature;
  updateTempValue();
  
  // 切换服务商时，不自动触发模型加载，防止使用错误的Key请求导致报错或限流
  // 用户输入Key时会自动触发，或者初始化时会触发
}

// 更新截图识题API配置
function updateImageAPIConfig() {
  const provider = document.getElementById('imageApiProvider').value;
  const config = API_CONFIGS[provider];
  
  if (!config) return;
  
  document.getElementById('imageApiEndpoint').value = config.endpoint;
  document.getElementById('imageModel').innerHTML = '<option value="">请先配置图片 API Key</option>';
  document.getElementById('imageModelTags').innerHTML = '';
  document.getElementById('imageApiKeyHelp').innerHTML = `${config.helpText}<br>📷 模型列表按平台接口全量显示；截图能否成功由所选模型能力决定。`;
  document.getElementById('imageMaxTokens').value = config.defaultMaxTokens;
  document.getElementById('imageTemperature').value = config.defaultTemperature;
  updateImageModelInfo();
  updateImageTempValue();
}

// 检查API并加载模型列表
async function checkAPIAndLoadModels() {
  const provider = document.getElementById('apiProvider').value;
  const apiKey = document.getElementById('apiKey').value;
  const apiEndpoint = document.getElementById('apiEndpoint').value;
  
  if (!apiKey || apiKey.trim().length < 5) {
    return;
  }
  
  const modelSelect = document.getElementById('model');
  // 只有当列表为空或者当前是预设列表时才显示加载中
  if (modelSelect.options.length <= 1) {
     modelSelect.innerHTML = '<option value="">🔄 正在加载模型列表...</option>';
  }
  
  try {
    const models = await loadModelsFromAPI(provider, apiKey, apiEndpoint);
    populateModelSelect(models);
    showStatus('模型列表已更新', 'success');
  } catch (error) {
    console.error('加载模型失败:', error);
    
    // 使用预设模型作为备选
    const presetModels = PRESET_MODELS[provider] || [];
    if (presetModels.length > 0) {
      populateModelSelect(presetModels);
      showStatus(`自动获取失败，已加载预设模型`, 'error');
    } else {
      modelSelect.innerHTML = '<option value="">⚠️ 加载失败，请手动输入模型ID</option>';
      showStatus(`加载失败: ${error.message}`, 'error');
    }
  }
}

// 检查截图API并加载支持图片的模型列表
async function checkImageAPIAndLoadModels() {
  const provider = document.getElementById('imageApiProvider').value;
  const apiKey = document.getElementById('imageApiKey').value;
  const apiEndpoint = document.getElementById('imageApiEndpoint').value;
  
  if (!apiKey || apiKey.trim().length < 5) {
    return;
  }
  
  const modelSelect = document.getElementById('imageModel');
  if (modelSelect.options.length <= 1) {
    modelSelect.innerHTML = '<option value="">🔄 正在加载图片模型列表...</option>';
  }
  
  try {
    const models = await loadModelsFromAPI(provider, apiKey, apiEndpoint);
    populateImageModelSelect(models);
    showStatus('图片模型列表已更新', 'success');
  } catch (error) {
    console.error('加载图片模型失败:', error);
    const presetModels = PRESET_MODELS[provider] || [];
    if (presetModels.length > 0) {
      populateImageModelSelect(presetModels);
      showStatus('自动获取失败，已加载图片预设模型', 'error');
    } else {
      modelSelect.innerHTML = '<option value="">⚠️ 加载失败，请手动输入模型ID</option>';
      showStatus(`图片模型加载失败: ${error.message}`, 'error');
    }
  }
}

// 从API加载模型列表
async function loadModelsFromAPI(provider, apiKey, apiEndpoint) {
  const config = API_CONFIGS[provider];
  
  if (!config.modelsEndpoint && provider !== 'custom') {
    // 如果没有模型端点且不是自定义，使用预设模型
    return PRESET_MODELS[provider] || [];
  }
  
  // 自定义API如果没有填endpoint，尝试猜测
  let url = config.modelsEndpoint;
  if (provider === 'custom') {
      // 简单的猜测：如果 endpoint 包含 chat/completions，替换为 models
      if (apiEndpoint.includes('chat/completions')) {
          url = apiEndpoint.replace('chat/completions', 'models');
      } else {
          return []; // 无法猜测
      }
  }
  
  // 构建请求头
  const headers = {
    'Content-Type': 'application/json'
  };
  
  // 根据提供商设置认证头
  const bearerProviders = [
    'openai', 'deepseek', 'novita', 'openrouter', 'siliconflow', 'qwen',
    'moonshot', 'zhipu', 'volcengine', 'minimax', 'groq', 'xai', 'mistral',
    'custom'
  ];

  if (bearerProviders.includes(provider)) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  } else if (provider === 'google') {
    url = `${config.modelsEndpoint}?key=${apiKey}`;
  }
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: headers
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    return parseModelsFromResponse(provider, data);
  } catch (error) {
    throw error;
  }
}

// 解析API响应中的模型列表
function parseModelsFromResponse(provider, data) {
  const models = [];
  
  // 标准 OpenAI 格式 (data.data)
  if (data.data && Array.isArray(data.data)) {
    data.data.forEach(model => {
      const id = model.id;
      let name = id;
      let supportsImage = false;
      
      // 简单的特征检测
      const idLower = id.toLowerCase();
      if (
        idLower.includes('vision') ||
        idLower.includes('gpt-4o') ||
        idLower.includes('claude-3') ||
        idLower.includes('gemini') ||
        idLower.includes('pixtral') ||
        idLower.includes('glm-4v') ||
        idLower.includes('qwen-vl') ||
        idLower.includes('-vl') ||
        idLower.includes('llama-4')
      ) {
        supportsImage = true;
      }
      
      // 过滤掉一些显然不是 LLM 的模型 (如 whisper, tts, dall-e)
      if (id.includes('whisper') || id.includes('tts') || id.includes('dall-e') || id.includes('embedding')) {
        return;
      }

      models.push({
        id: id,
        name: name,
        supportsImage: supportsImage
      });
    });
    
    // 排序：最新的/常用的排前面
    models.sort((a, b) => {
        // DeepSeek 特殊处理
        if (a.id === 'deepseek-reasoner') return -1;
        if (b.id === 'deepseek-reasoner') return 1;
        return a.id.localeCompare(b.id);
    });
    
    return models;
  }
  
  // Google Gemini 格式 (data.models)
  if (data.models && Array.isArray(data.models)) {
      data.models.forEach(model => {
          let id = model.name;
          if (id.startsWith('models/')) {
              id = id.replace('models/', '');
          }
          const supportsImage = model.inputModalities && model.inputModalities.includes('IMAGE');
          models.push({
              id: id,
              name: model.displayName || id,
              supportsImage: supportsImage
          });
      });
      return models;
  }

  return [];
}

// 填充模型选择框
function populateModelSelect(models) {
  const modelSelect = document.getElementById('model');
  const currentVal = modelSelect.value;
  
  modelSelect.innerHTML = '';
  
  if (models.length === 0) {
    modelSelect.innerHTML = '<option value="">未找到可用模型</option>';
    return;
  }
  
  models.forEach(model => {
    const option = document.createElement('option');
    option.value = model.id;
    let icon = '';
    if (model.supportsImage) icon += ' 📷';
    if (model.id.includes('reasoner') || model.id.includes('r1')) icon += ' 🧠';
    
    option.textContent = `${model.name || model.id}${icon}`;
    modelSelect.appendChild(option);
  });
  
  // 尝试恢复之前的选择，或者选第一个
  if (currentVal && models.some(m => m.id === currentVal)) {
      modelSelect.value = currentVal;
  } else if (models.length > 0) {
    modelSelect.value = models[0].id;
  }
  
  updateModelInfo();
}

// 填充截图识题模型选择框。这里不替用户判断模型类型，按平台返回全量展示。
function populateImageModelSelect(models) {
  const modelSelect = document.getElementById('imageModel');
  const currentVal = modelSelect.value;
  
  modelSelect.innerHTML = '';
  
  if (models.length === 0) {
    modelSelect.innerHTML = '<option value="">未找到可用模型</option>';
    document.getElementById('imageModelInfo').textContent = '未从平台获取到模型列表，可以手动填写官网模型 Code。';
    return;
  }
  
  models.forEach(model => {
    const option = document.createElement('option');
    option.value = model.id;
    let icon = '';
    if (model.id.includes('reasoner') || model.id.includes('r1')) icon += ' 🧠';
    option.textContent = `${model.name || model.id}${icon}`;
    modelSelect.appendChild(option);
  });
  
  if (currentVal && models.some(m => m.id === currentVal)) {
    modelSelect.value = currentVal;
  } else if (models.length > 0) {
    modelSelect.value = models[0].id;
  }
  
  updateImageModelInfo();
}

// 更新模型信息
function updateModelInfo() {
  const model = document.getElementById('model').value;
  const manualModel = document.getElementById('modelManual').value.trim();
  const modelSelect = document.getElementById('model');
  const tagsDiv = document.getElementById('modelTags');
  const infoDiv = document.getElementById('modelInfo');
  
  tagsDiv.innerHTML = '';
  infoDiv.textContent = '如果官网显示的模型没有出现在下拉框，可以直接手动填写模型 Code。';
  
  if (manualModel) {
    infoDiv.textContent = `将使用手动填写的模型：${manualModel}`;
    return;
  }
  
  if (!model) return;
  
  const selectedOption = modelSelect.querySelector(`option[value="${model}"]`);
  if (!selectedOption) return;
  
  const text = selectedOption.textContent;
  
  if (text.includes('📷')) {
      tagsDiv.innerHTML += '<span class="tag">支持图片</span>';
  } else {
      // 用户反馈不想看到“文本模型”标签，或者我们默认所有模型都尝试支持图片
      // 但为了UI信息准确，这里还是区分一下显示，只是实际逻辑上不再拦截
      // 如果不想显示任何标签，可以注释掉下面这行
      // tagsDiv.innerHTML += '<span class="tag" style="background:#f3f4f6; color:#666">文本模型</span>';
  }
}

// 更新截图识题模型信息
function updateImageModelInfo() {
  const model = document.getElementById('imageModel').value;
  const manualModel = document.getElementById('imageModelManual').value.trim();
  const modelSelect = document.getElementById('imageModel');
  const tagsDiv = document.getElementById('imageModelTags');
  const infoDiv = document.getElementById('imageModelInfo');
  
  tagsDiv.innerHTML = '';
  infoDiv.textContent = '这里显示平台返回的全部模型；截图能否成功取决于你选择的模型是否支持图片。';

  if (manualModel) {
    infoDiv.textContent = `将使用手动填写的截图模型：${manualModel}`;
    return;
  }
  
  if (!model) return;
  
  const selectedOption = modelSelect.querySelector(`option[value="${model}"]`);
  if (!selectedOption) return;
  
  const text = selectedOption.textContent;
  
  infoDiv.textContent = `将使用平台返回的模型：${model}`;
}

// 更新温度值显示
function updateTempValue() {
  const tempInput = document.getElementById('temperature');
  const tempValue = document.getElementById('tempValue');
  tempValue.textContent = tempInput.value;
}

// 更新截图识题温度值显示
function updateImageTempValue() {
  const tempInput = document.getElementById('imageTemperature');
  const tempValue = document.getElementById('imageTempValue');
  tempValue.textContent = tempInput.value;
}

// 加载设置
function loadSettings() {
  if (!chrome.storage || !chrome.storage.sync) return;
  
  chrome.storage.sync.get([
    'apiProvider', 'apiKey', 'apiEndpoint', 'model', 'maxTokens', 
    'temperature', 'showFloatingIcon', 'fastMode',
    'textApiProvider', 'textApiKey', 'textApiEndpoint', 'textModel', 'textMaxTokens', 'textTemperature',
    'imageApiProvider', 'imageApiKey', 'imageApiEndpoint', 'imageModel', 'imageMaxTokens', 'imageTemperature'
  ], function(result) {
    const textApiProvider = result.textApiProvider || result.apiProvider || 'deepseek';
    const textApiKey = result.textApiKey || result.apiKey || '';
    const textApiEndpoint = result.textApiEndpoint || result.apiEndpoint || '';
    const textModel = result.textModel || result.model || '';
    const textMaxTokens = result.textMaxTokens || result.maxTokens;
    const textTemperature = result.textTemperature || result.temperature;

    document.getElementById('apiProvider').value = textApiProvider;
    updateAPIConfig();
    if (textApiKey) document.getElementById('apiKey').value = textApiKey;
    if (textApiEndpoint) document.getElementById('apiEndpoint').value = textApiEndpoint;
    if (textMaxTokens) document.getElementById('maxTokens').value = textMaxTokens;
    if (textTemperature) {
      document.getElementById('temperature').value = textTemperature;
      updateTempValue();
    }

    const imageApiProvider = result.imageApiProvider || 'google';
    document.getElementById('imageApiProvider').value = imageApiProvider;
    updateImageAPIConfig();
    if (result.imageApiKey) document.getElementById('imageApiKey').value = result.imageApiKey;
    if (result.imageApiEndpoint) document.getElementById('imageApiEndpoint').value = result.imageApiEndpoint;
    if (result.imageMaxTokens) document.getElementById('imageMaxTokens').value = result.imageMaxTokens;
    if (result.imageTemperature) {
      document.getElementById('imageTemperature').value = result.imageTemperature;
      updateImageTempValue();
    }

    if (result.showFloatingIcon !== undefined) {
      document.getElementById('showFloatingIcon').checked = result.showFloatingIcon;
    }
    if (result.fastMode !== undefined) {
      document.getElementById('fastMode').checked = result.fastMode;
    }
    
    // 延迟加载模型列表，确保 key 已填入
    if (textApiKey) {
        checkAPIAndLoadModels().then(() => {
            restoreModelSelection('model', 'modelManual', textModel, updateModelInfo);
        });
    } else {
      restoreModelSelection('model', 'modelManual', textModel, updateModelInfo);
    }

    if (result.imageApiKey) {
      checkImageAPIAndLoadModels().then(() => {
        restoreModelSelection('imageModel', 'imageModelManual', result.imageModel, updateImageModelInfo);
      });
    } else {
      restoreModelSelection('imageModel', 'imageModelManual', result.imageModel, updateImageModelInfo);
    }
  });
}

// 保存设置
function saveSettings() {
  const textApiProvider = document.getElementById('apiProvider').value;
  const textApiKey = document.getElementById('apiKey').value;
  const textApiEndpoint = document.getElementById('apiEndpoint').value;
  const textModel = getSelectedOrManualModel('model', 'modelManual');
  const textMaxTokens = parseInt(document.getElementById('maxTokens').value);
  const textTemperature = parseFloat(document.getElementById('temperature').value);
  const imageApiProvider = document.getElementById('imageApiProvider').value;
  const imageApiKey = document.getElementById('imageApiKey').value;
  const imageApiEndpoint = document.getElementById('imageApiEndpoint').value;
  const imageModel = getSelectedOrManualModel('imageModel', 'imageModelManual');
  const imageMaxTokens = parseInt(document.getElementById('imageMaxTokens').value);
  const imageTemperature = parseFloat(document.getElementById('imageTemperature').value);
  const showFloatingIcon = document.getElementById('showFloatingIcon').checked;
  const fastMode = document.getElementById('fastMode').checked;
  
  chrome.storage.sync.set({
    textApiProvider,
    textApiKey,
    textApiEndpoint,
    textModel,
    textMaxTokens,
    textTemperature,
    imageApiProvider,
    imageApiKey,
    imageApiEndpoint,
    imageModel,
    imageMaxTokens,
    imageTemperature,
    showFloatingIcon,
    fastMode,
    // 保留旧字段，避免旧 content script 或旧设置页读取不到。
    apiProvider: textApiProvider,
    apiKey: textApiKey,
    apiEndpoint: textApiEndpoint,
    model: textModel,
    maxTokens: textMaxTokens,
    temperature: textTemperature
  }, function() {
    showStatus('设置已保存', 'success');
    
    // 通知content script
    if (chrome.tabs && chrome.tabs.query) {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'updateSettings',
                    settings: {
                      textApiProvider,
                      textApiKey,
                      textApiEndpoint,
                      textModel,
                      textMaxTokens,
                      textTemperature,
                      imageApiProvider,
                      imageApiKey,
                      imageApiEndpoint,
                      imageModel,
                      imageMaxTokens,
                      imageTemperature,
                      showFloatingIcon,
                      fastMode,
                      apiProvider: textApiProvider,
                      apiKey: textApiKey,
                      apiEndpoint: textApiEndpoint,
                      model: textModel,
                      maxTokens: textMaxTokens,
                      temperature: textTemperature
                    }
                });
            }
        });
    }
  });
}

// 测试文字API连接
function testTextAPI() {
  testAPIFromFields({
    apiProvider: document.getElementById('apiProvider').value,
    apiKey: document.getElementById('apiKey').value,
    apiEndpoint: document.getElementById('apiEndpoint').value,
    model: getSelectedOrManualModel('model', 'modelManual'),
    label: '文字 API'
  });
}

// 测试截图API连接
function testImageAPI() {
  testAPIFromFields({
    apiProvider: document.getElementById('imageApiProvider').value,
    apiKey: document.getElementById('imageApiKey').value,
    apiEndpoint: document.getElementById('imageApiEndpoint').value,
    model: getSelectedOrManualModel('imageModel', 'imageModelManual'),
    label: '截图 API'
  });
}

function testAPIFromFields({ apiProvider, apiKey, apiEndpoint, model, label }) {
  
  if (!apiKey) {
    showStatus(`请先输入${label} Key`, 'error');
    return;
  }
  
  showStatus(`正在测试${label}连接...`, 'success');
  
  chrome.runtime.sendMessage({
    action: 'testAPI',
    apiProvider, apiKey, apiEndpoint, model,
    maxTokens: 100,
    temperature: 0.7
  }, function(response) {
    if (response && response.success) {
      showStatus(`${label}连接成功！`, 'success');
    } else {
      showStatus(`${label}连接失败: ${response ? response.error : '未知错误'}`, 'error');
    }
  });
}

// 显示状态信息
function showStatus(message, type) {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = message;
  statusDiv.className = 'status ' + type;
  statusDiv.style.display = 'block';
  setTimeout(() => {
    statusDiv.style.display = 'none';
  }, 3000);
}
