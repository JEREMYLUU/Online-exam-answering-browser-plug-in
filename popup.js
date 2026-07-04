const PROVIDER_NAMES = {
  deepseek: 'DeepSeek',
  google: 'Gemini',
  qwen: '阿里云百炼',
  openrouter: 'OpenRouter',
  siliconflow: 'SiliconFlow',
  groq: 'Groq',
  mistral: 'Mistral',
  openai: 'OpenAI',
  anthropic: 'Claude',
  moonshot: 'Kimi',
  zhipu: '智谱',
  volcengine: '火山方舟',
  minimax: 'MiniMax',
  xai: 'xAI',
  novita: 'MegaLLM',
  custom: '自定义'
};

let currentSettings = {};

document.addEventListener('DOMContentLoaded', () => {
  bindEvents();
  loadSettings();
});

function bindEvents() {
  document.getElementById('openOptions').addEventListener('click', openOptions);
  document.getElementById('openOptionsFooter').addEventListener('click', openOptions);
  document.getElementById('openTextSettings').addEventListener('click', openOptions);
  document.getElementById('openImageSettings').addEventListener('click', openOptions);
  document.getElementById('openTutorial').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('tutorial.html') });
  });
  document.getElementById('runScreenshot').addEventListener('click', runScreenshot);
  document.getElementById('runTextAnswer').addEventListener('click', runPrimaryAction);
  document.getElementById('testConnection').addEventListener('click', testConnections);
  document.getElementById('fastMode').addEventListener('change', saveFastMode);
}

function openOptions() {
  chrome.tabs.create({ url: chrome.runtime.getURL('options.html') });
}

function loadSettings() {
  chrome.storage.sync.get([
    'apiProvider', 'apiKey', 'apiEndpoint', 'model', 'maxTokens', 'temperature',
    'textApiProvider', 'textApiKey', 'textApiEndpoint', 'textModel', 'textMaxTokens', 'textTemperature',
    'imageApiProvider', 'imageApiKey', 'imageApiEndpoint', 'imageModel', 'imageMaxTokens', 'imageTemperature',
    'fastMode'
  ], (result) => {
    const textApiProvider = result.textApiProvider || result.apiProvider || 'deepseek';
    const imageApiProvider = result.imageApiProvider || 'google';

    currentSettings = {
      textApiProvider,
      textApiKey: result.textApiKey || result.apiKey || '',
      textApiEndpoint: result.textApiEndpoint || result.apiEndpoint || defaultEndpoint(textApiProvider),
      textModel: result.textModel || result.model || defaultModel(textApiProvider, 'text'),
      textMaxTokens: result.textMaxTokens || result.maxTokens || 1500,
      textTemperature: result.textTemperature || result.temperature || 0.7,
      imageApiProvider,
      imageApiKey: result.imageApiKey || '',
      imageApiEndpoint: result.imageApiEndpoint || defaultEndpoint(imageApiProvider),
      imageModel: result.imageModel || defaultModel(imageApiProvider, 'image'),
      imageMaxTokens: result.imageMaxTokens || 2500,
      imageTemperature: result.imageTemperature || 0.7,
      fastMode: result.fastMode !== false
    };

    renderState();
  });
}

function renderState() {
  const hasText = Boolean(currentSettings.textApiKey && currentSettings.textModel);
  const hasImage = Boolean(currentSettings.imageApiKey && currentSettings.imageModel);
  const configState = document.getElementById('configState');
  const statusText = document.getElementById('statusText');

  document.getElementById('textModelSummary').textContent = formatSummary(
    currentSettings.textApiProvider,
    currentSettings.textModel,
    hasText
  );
  document.getElementById('imageModelSummary').textContent = formatSummary(
    currentSettings.imageApiProvider,
    currentSettings.imageModel,
    hasImage
  );
  document.getElementById('fastMode').checked = currentSettings.fastMode;

  if (hasText && hasImage) {
    configState.textContent = '已配置';
    configState.className = 'is-ready';
    statusText.textContent = '选中文字或截图即可使用';
    return;
  }

  if (hasText || hasImage) {
    configState.textContent = '部分配置';
    configState.className = 'is-warning';
    statusText.textContent = hasText ? '截图 API 未配置' : '文字 API 未配置';
    return;
  }

  configState.textContent = '未配置 API';
  configState.className = 'is-warning';
  statusText.textContent = '点击设置完成 API 配置';
}

function formatSummary(provider, model, ready) {
  if (!ready) return '去设置';
  const name = PROVIDER_NAMES[provider] || provider || '自定义';
  return `${name} · ${model}`;
}

function saveFastMode() {
  const fastMode = document.getElementById('fastMode').checked;
  currentSettings.fastMode = fastMode;
  chrome.storage.sync.set({ fastMode }, () => {
    setStatus(fastMode ? '快速模式已开启' : '快速模式已关闭');
    notifyActiveTab({ action: 'updateSettings', settings: { fastMode } });
  });
}

function runPrimaryAction() {
  if (currentSettings.imageApiKey) {
    runScreenshot();
    return;
  }

  notifyActiveTab({ action: 'runSelectedText' }, (response) => {
    if (response && response.success) {
      setStatus('已尝试读取页面选中文字');
    } else {
      setStatus(response?.error || '请先选中题目文字，或去设置配置截图 API');
    }
  });
}

function runScreenshot() {
  if (!currentSettings.imageApiKey) {
    setStatus('请先在设置中配置截图识题 API');
    openOptions();
    return;
  }

  notifyActiveTab({ action: 'runScreenshot' }, (response) => {
    if (response && response.success) {
      setStatus('正在截图识题...');
    } else {
      setStatus(response?.error || '当前页面暂时无法触发截图');
    }
  });
}

function testConnections() {
  const tasks = [];

  if (currentSettings.textApiKey && currentSettings.textModel) {
    tasks.push(testApi({
      label: '文字',
      apiProvider: currentSettings.textApiProvider,
      apiKey: currentSettings.textApiKey,
      apiEndpoint: currentSettings.textApiEndpoint,
      model: currentSettings.textModel
    }));
  }

  if (currentSettings.imageApiKey && currentSettings.imageModel) {
    tasks.push(testApi({
      label: '截图',
      apiProvider: currentSettings.imageApiProvider,
      apiKey: currentSettings.imageApiKey,
      apiEndpoint: currentSettings.imageApiEndpoint,
      model: currentSettings.imageModel
    }));
  }

  if (!tasks.length) {
    setStatus('请先去设置配置 API');
    openOptions();
    return;
  }

  setStatus('正在测试连接...');
  Promise.all(tasks).then((results) => {
    const failed = results.find((result) => !result.success);
    if (failed) {
      setStatus(`${failed.label}连接失败`);
      return;
    }
    setStatus('连接正常');
  });
}

function testApi({ label, apiProvider, apiKey, apiEndpoint, model }) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({
      action: 'testAPI',
      apiProvider,
      apiKey,
      apiEndpoint,
      model,
      maxTokens: 100,
      temperature: 0.7
    }, (response) => {
      resolve({ label, success: Boolean(response && response.success) });
    });
  });
}

function notifyActiveTab(message, callback = () => {}) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (!tab?.id) {
      callback({ success: false, error: '没有可用的当前页面' });
      return;
    }

    chrome.tabs.sendMessage(tab.id, message, (response) => {
      if (chrome.runtime.lastError) {
        callback({ success: false, error: '请刷新当前页面后再试' });
        return;
      }
      callback(response || { success: true });
    });
  });
}

function setStatus(message) {
  document.getElementById('statusText').textContent = message;
}

function defaultEndpoint(provider) {
  const endpoints = {
    deepseek: 'https://api.deepseek.com/chat/completions',
    google: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
    qwen: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    openrouter: 'https://openrouter.ai/api/v1/chat/completions',
    siliconflow: 'https://api.siliconflow.cn/v1/chat/completions',
    groq: 'https://api.groq.com/openai/v1/chat/completions',
    mistral: 'https://api.mistral.ai/v1/chat/completions',
    openai: 'https://api.openai.com/v1/chat/completions',
    anthropic: 'https://api.anthropic.com/v1/messages',
    moonshot: 'https://api.moonshot.cn/v1/chat/completions',
    zhipu: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    volcengine: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
    minimax: 'https://api.minimaxi.com/v1/chat/completions',
    xai: 'https://api.x.ai/v1/chat/completions',
    novita: 'https://ai.megallm.io/v1/chat/completions'
  };
  return endpoints[provider] || '';
}

function defaultModel(provider, kind) {
  if (kind === 'image') {
    return {
      google: 'gemini-2.5-flash',
      qwen: 'qwen-vl-plus',
      openai: 'gpt-4o-mini',
      zhipu: 'glm-4v',
      mistral: 'pixtral-large-latest'
    }[provider] || '';
  }

  return {
    deepseek: 'deepseek-chat',
    google: 'gemini-2.5-flash',
    qwen: 'qwen-plus',
    openrouter: 'openrouter/free',
    siliconflow: 'deepseek-ai/DeepSeek-V3',
    groq: 'llama-3.3-70b-versatile',
    mistral: 'mistral-small-latest'
  }[provider] || '';
}
