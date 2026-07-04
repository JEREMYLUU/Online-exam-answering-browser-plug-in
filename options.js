const PROVIDERS = {
  google: {
    label: 'Google Gemini (免费额度 / 截图优先)',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
    modelsEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
    help: '推荐新手先试。Gemini API 有 Free Tier，适合截图识题。',
    keyUrl: 'https://aistudio.google.com/app/apikey',
    textMaxTokens: 2500,
    imageMaxTokens: 2500,
    temperature: 0.7,
    presets: [
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
      { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' }
    ]
  },
  openrouter: {
    label: 'OpenRouter (免费模型 / 聚合平台)',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    modelsEndpoint: 'https://openrouter.ai/api/v1/models',
    help: '一个 Key 可试多家模型，免费模型可能限流。',
    keyUrl: 'https://openrouter.ai/settings/keys',
    textMaxTokens: 1500,
    imageMaxTokens: 2500,
    temperature: 0.7,
    presets: [
      { id: 'openrouter/free', name: 'OpenRouter Free Router' },
      { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
      { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini' }
    ]
  },
  siliconflow: {
    label: 'SiliconFlow 硅基流动 (免费模型)',
    endpoint: 'https://api.siliconflow.cn/v1/chat/completions',
    modelsEndpoint: 'https://api.siliconflow.cn/v1/models',
    help: '国内访问友好，免费模型以控制台当前显示为准。',
    keyUrl: 'https://cloud.siliconflow.cn/account/ak',
    textMaxTokens: 1500,
    imageMaxTokens: 2500,
    temperature: 0.7,
    presets: [
      { id: 'deepseek-ai/DeepSeek-R1', name: 'DeepSeek R1' },
      { id: 'deepseek-ai/DeepSeek-V3', name: 'DeepSeek V3' },
      { id: 'Qwen/Qwen2.5-VL-72B-Instruct', name: 'Qwen2.5-VL 72B' }
    ]
  },
  qwen: {
    label: '阿里云百炼 / 通义千问 (新人免费额度)',
    endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    modelsEndpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/models',
    help: '新人通常有免费额度；官网模型 Code 可手动填写。',
    keyUrl: 'https://bailian.console.aliyun.com/?apiKey=1',
    textMaxTokens: 1500,
    imageMaxTokens: 2500,
    temperature: 0.7,
    presets: [
      { id: 'qwen-plus', name: 'Qwen Plus' },
      { id: 'qwen-turbo', name: 'Qwen Turbo' },
      { id: 'qwen-vl-plus', name: 'Qwen VL Plus' }
    ]
  },
  groq: {
    label: 'Groq (免费试用 / 文本高速)',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    modelsEndpoint: 'https://api.groq.com/openai/v1/models',
    help: '适合高速文本搜题；截图能力以模型说明为准。',
    keyUrl: 'https://console.groq.com/keys',
    textMaxTokens: 1500,
    imageMaxTokens: 2500,
    temperature: 0.7,
    presets: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile' },
      { id: 'meta-llama/llama-4-scout-17b-16e-instruct', name: 'Llama 4 Scout' },
      { id: 'qwen/qwen3-32b', name: 'Qwen3 32B' }
    ]
  },
  mistral: {
    label: 'Mistral AI (Free mode)',
    endpoint: 'https://api.mistral.ai/v1/chat/completions',
    modelsEndpoint: 'https://api.mistral.ai/v1/models',
    help: 'Free mode 以控制台当前政策为准，Pixtral 可用于图片。',
    keyUrl: 'https://console.mistral.ai/api-keys/',
    textMaxTokens: 1500,
    imageMaxTokens: 2500,
    temperature: 0.7,
    presets: [
      { id: 'mistral-small-latest', name: 'Mistral Small Latest' },
      { id: 'mistral-large-latest', name: 'Mistral Large Latest' },
      { id: 'pixtral-large-latest', name: 'Pixtral Large Latest' }
    ]
  },
  deepseek: {
    label: 'DeepSeek (深度求索)',
    endpoint: 'https://api.deepseek.com/chat/completions',
    modelsEndpoint: 'https://api.deepseek.com/models',
    help: '低成本文本搜题常用；截图识题请选择支持图片的平台或模型。',
    keyUrl: 'https://platform.deepseek.com/',
    textMaxTokens: 1500,
    imageMaxTokens: 2500,
    temperature: 1,
    presets: [
      { id: 'deepseek-chat', name: 'DeepSeek Chat' },
      { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner' }
    ]
  },
  novita: {
    label: 'MegaLLM',
    endpoint: 'https://ai.megallm.io/v1/chat/completions',
    modelsEndpoint: 'https://ai.megallm.io/v1/models',
    help: '兼容 OpenAI 格式的模型服务。',
    keyUrl: 'https://megallm.io/',
    textMaxTokens: 1500,
    imageMaxTokens: 2500,
    temperature: 0.7,
    presets: [
      { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1' },
      { id: 'deepseek/deepseek-v3', name: 'DeepSeek V3' }
    ]
  },
  openai: {
    label: 'OpenAI (GPT)',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    modelsEndpoint: 'https://api.openai.com/v1/models',
    help: '可直接填写 OpenAI 平台显示的模型 Code。',
    keyUrl: 'https://platform.openai.com/api-keys',
    textMaxTokens: 1500,
    imageMaxTokens: 2500,
    temperature: 0.7,
    presets: [
      { id: 'gpt-4o', name: 'GPT-4o' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini' }
    ]
  },
  anthropic: {
    label: 'Anthropic (Claude)',
    endpoint: 'https://api.anthropic.com/v1/messages',
    modelsEndpoint: null,
    help: 'Anthropic 不提供通用模型列表接口，可手动填写模型 Code。',
    keyUrl: 'https://console.anthropic.com/',
    textMaxTokens: 1500,
    imageMaxTokens: 2500,
    temperature: 0.7,
    presets: [
      { id: 'claude-3-5-sonnet-20240620', name: 'Claude 3.5 Sonnet' },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' }
    ]
  },
  moonshot: {
    label: 'Moonshot / Kimi',
    endpoint: 'https://api.moonshot.cn/v1/chat/completions',
    modelsEndpoint: 'https://api.moonshot.cn/v1/models',
    help: '适合文本题和长上下文。',
    keyUrl: 'https://platform.moonshot.cn/console/api-keys',
    textMaxTokens: 1500,
    imageMaxTokens: 2500,
    temperature: 0.7,
    presets: [
      { id: 'moonshot-v1-8k', name: 'Moonshot v1 8K' },
      { id: 'moonshot-v1-32k', name: 'Moonshot v1 32K' },
      { id: 'moonshot-v1-128k', name: 'Moonshot v1 128K' }
    ]
  },
  zhipu: {
    label: '智谱 GLM',
    endpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    modelsEndpoint: 'https://open.bigmodel.cn/api/paas/v4/models',
    help: '可直接填写智谱官网模型 Code。',
    keyUrl: 'https://bigmodel.cn/usercenter/proj-mgmt/apikeys',
    textMaxTokens: 1500,
    imageMaxTokens: 2500,
    temperature: 0.7,
    presets: [
      { id: 'glm-4-flash', name: 'GLM-4 Flash' },
      { id: 'glm-4', name: 'GLM-4' },
      { id: 'glm-4v', name: 'GLM-4V' }
    ]
  },
  volcengine: {
    label: '火山方舟 / 豆包',
    endpoint: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
    modelsEndpoint: 'https://ark.cn-beijing.volces.com/api/v3/models',
    help: '需要选择已开通的模型或推理接入点。',
    keyUrl: 'https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey',
    textMaxTokens: 1500,
    imageMaxTokens: 2500,
    temperature: 0.7,
    presets: [
      { id: 'doubao-seed-1-6-flash-250615', name: 'Doubao Seed 1.6 Flash' },
      { id: 'doubao-1-5-vision-pro-250328', name: 'Doubao Vision Pro' }
    ]
  },
  minimax: {
    label: 'MiniMax',
    endpoint: 'https://api.minimaxi.com/v1/chat/completions',
    modelsEndpoint: 'https://api.minimaxi.com/v1/models',
    help: '文本和视觉能力以 MiniMax 平台模型说明为准。',
    keyUrl: 'https://platform.minimaxi.com/user-center/basic-information/interface-key',
    textMaxTokens: 1500,
    imageMaxTokens: 2500,
    temperature: 0.7,
    presets: [
      { id: 'MiniMax-M3', name: 'MiniMax M3' },
      { id: 'MiniMax-M2.7', name: 'MiniMax M2.7' }
    ]
  },
  xai: {
    label: 'xAI',
    endpoint: 'https://api.x.ai/v1/chat/completions',
    modelsEndpoint: 'https://api.x.ai/v1/models',
    help: '可填写 xAI Console 当前模型 Code。',
    keyUrl: 'https://console.x.ai/',
    textMaxTokens: 1500,
    imageMaxTokens: 2500,
    temperature: 0.7,
    presets: [
      { id: 'grok-3', name: 'Grok 3' },
      { id: 'grok-3-mini', name: 'Grok 3 Mini' },
      { id: 'grok-2-vision-1212', name: 'Grok 2 Vision' }
    ]
  },
  custom: {
    label: '自定义 API',
    endpoint: '',
    modelsEndpoint: null,
    help: '请输入兼容 OpenAI Chat Completions 的 API 地址和模型 Code。',
    keyUrl: '',
    textMaxTokens: 1500,
    imageMaxTokens: 2500,
    temperature: 0.7,
    presets: []
  }
};

const $ = (id) => document.getElementById(id);

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initProviderSelects();
  bindEvents();
  loadSettings();

  if (new URLSearchParams(location.search).get('welcome') === '1') {
    $('pageSubtitle').textContent = '欢迎使用，先完成首次配置';
    showPanel('welcomePanel');
  }
});

function initNavigation() {
  document.querySelectorAll('.nav-item').forEach((button) => {
    button.addEventListener('click', () => showPanel(button.dataset.panel));
  });

  document.querySelectorAll('[data-go-panel]').forEach((button) => {
    button.addEventListener('click', () => showPanel(button.dataset.goPanel));
  });

  document.querySelectorAll('.choice').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.choice').forEach((item) => item.classList.remove('selected'));
      button.classList.add('selected');
      if (button.dataset.use === 'free') {
        $('textApiProvider').value = 'deepseek';
        $('imageApiProvider').value = 'google';
        updateProviderUi('text');
        updateProviderUi('image');
      }
      if (button.dataset.use === 'own') {
        showPanel('modelPanel');
      }
    });
  });
}

function showPanel(panelId) {
  document.querySelectorAll('.panel').forEach((panel) => panel.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach((button) => {
    button.classList.toggle('active', button.dataset.panel === panelId);
  });
  $(panelId).classList.add('active');
}

function initProviderSelects() {
  const options = Object.entries(PROVIDERS)
    .map(([value, config]) => `<option value="${value}">${config.label}</option>`)
    .join('');
  $('textApiProvider').innerHTML = options;
  $('imageApiProvider').innerHTML = options;
}

function bindEvents() {
  $('saveAllTop').addEventListener('click', saveSettings);
  $('openTutorial').addEventListener('click', openTutorial);
  $('openApiTutorialFromWelcome').addEventListener('click', openTutorial);
  $('textApiProvider').addEventListener('change', () => updateProviderUi('text'));
  $('imageApiProvider').addEventListener('change', () => updateProviderUi('image'));
  $('loadTextModels').addEventListener('click', () => loadModels('text'));
  $('loadImageModels').addEventListener('click', () => loadModels('image'));
  $('testTextApi').addEventListener('click', () => testApi('text'));
  $('testImageApi').addEventListener('click', () => testApi('image'));
  $('copyTextToImage').addEventListener('click', copyTextToImage);
}

function openTutorial() {
  chrome.tabs.create({ url: chrome.runtime.getURL('tutorial.html') });
}

function updateProviderUi(kind) {
  const prefix = kind === 'text' ? 'text' : 'image';
  const provider = $(`${prefix}ApiProvider`).value;
  const config = PROVIDERS[provider];
  const maxTokensId = kind === 'text' ? 'textMaxTokens' : 'imageMaxTokens';
  const helpId = kind === 'text' ? 'textProviderHelp' : 'imageProviderHelp';

  $(`${prefix}ApiEndpoint`).value = config.endpoint;
  $(maxTokensId).value = kind === 'text' ? config.textMaxTokens : config.imageMaxTokens;
  $(`${prefix}Temperature`).value = config.temperature;
  $(helpId).innerHTML = config.keyUrl
    ? `${config.help} <a href="${config.keyUrl}" target="_blank" rel="noopener">获取 API Key</a>`
    : config.help;
  populateModels(kind, config.presets);
}

function loadSettings() {
  chrome.storage.sync.get([
    'apiProvider', 'apiKey', 'apiEndpoint', 'model', 'maxTokens', 'temperature',
    'textApiProvider', 'textApiKey', 'textApiEndpoint', 'textModel', 'textMaxTokens', 'textTemperature',
    'imageApiProvider', 'imageApiKey', 'imageApiEndpoint', 'imageModel', 'imageMaxTokens', 'imageTemperature',
    'showFloatingIcon', 'fastMode', 'answerStyle', 'accountEmail'
  ], (result) => {
    const textProvider = result.textApiProvider || result.apiProvider || 'deepseek';
    const imageProvider = result.imageApiProvider || 'google';

    $('textApiProvider').value = textProvider;
    $('imageApiProvider').value = imageProvider;
    updateProviderUi('text');
    updateProviderUi('image');

    $('textApiKey').value = result.textApiKey || result.apiKey || '';
    $('textApiEndpoint').value = result.textApiEndpoint || result.apiEndpoint || PROVIDERS[textProvider].endpoint;
    restoreModel('text', result.textModel || result.model || '');
    $('textMaxTokens').value = result.textMaxTokens || result.maxTokens || PROVIDERS[textProvider].textMaxTokens;
    $('textTemperature').value = result.textTemperature || result.temperature || PROVIDERS[textProvider].temperature;

    $('imageApiKey').value = result.imageApiKey || '';
    $('imageApiEndpoint').value = result.imageApiEndpoint || PROVIDERS[imageProvider].endpoint;
    restoreModel('image', result.imageModel || '');
    $('imageMaxTokens').value = result.imageMaxTokens || PROVIDERS[imageProvider].imageMaxTokens;
    $('imageTemperature').value = result.imageTemperature || PROVIDERS[imageProvider].temperature;

    $('showFloatingIcon').checked = result.showFloatingIcon !== false;
    $('fastMode').checked = result.fastMode !== false;
    $('answerStyle').value = result.answerStyle || 'direct';
    $('accountEmail').value = result.accountEmail || '';
    updateSetupState();
  });
}

function restoreModel(kind, modelId) {
  if (!modelId) return;
  const select = $(`${kind}ModelSelect`);
  const manual = $(`${kind}ModelManual`);
  const found = Array.from(select.options).some((option) => option.value === modelId);
  if (found) {
    select.value = modelId;
    manual.value = '';
  } else {
    manual.value = modelId;
  }
}

function saveSettings() {
  const textModel = getModelValue('text');
  const imageModel = getModelValue('image');
  const settings = {
    textApiProvider: $('textApiProvider').value,
    textApiKey: $('textApiKey').value.trim(),
    textApiEndpoint: $('textApiEndpoint').value.trim(),
    textModel,
    textMaxTokens: parseInt($('textMaxTokens').value, 10),
    textTemperature: parseFloat($('textTemperature').value),
    imageApiProvider: $('imageApiProvider').value,
    imageApiKey: $('imageApiKey').value.trim(),
    imageApiEndpoint: $('imageApiEndpoint').value.trim(),
    imageModel,
    imageMaxTokens: parseInt($('imageMaxTokens').value, 10),
    imageTemperature: parseFloat($('imageTemperature').value),
    showFloatingIcon: $('showFloatingIcon').checked,
    fastMode: $('fastMode').checked,
    answerStyle: $('answerStyle').value,
    accountEmail: $('accountEmail').value.trim(),
    apiProvider: $('textApiProvider').value,
    apiKey: $('textApiKey').value.trim(),
    apiEndpoint: $('textApiEndpoint').value.trim(),
    model: textModel,
    maxTokens: parseInt($('textMaxTokens').value, 10),
    temperature: parseFloat($('textTemperature').value)
  };

  chrome.storage.sync.set(settings, () => {
    updateSetupState();
    showStatus('设置已保存', 'success');
  });
}

function getModelValue(kind) {
  const manual = $(`${kind}ModelManual`).value.trim();
  return manual || $(`${kind}ModelSelect`).value;
}

async function loadModels(kind) {
  const provider = $(`${kind}ApiProvider`).value;
  const apiKey = $(`${kind}ApiKey`).value.trim();
  const endpoint = $(`${kind}ApiEndpoint`).value.trim();

  if (!apiKey && provider !== 'custom') {
    populateModels(kind, PROVIDERS[provider].presets);
    showStatus('未填写 API Key，已显示预设模型。', 'error');
    return;
  }

  try {
    $(`${kind}ModelSelect`).innerHTML = '<option value="">正在获取模型列表...</option>';
    const models = await loadModelsFromApi(provider, apiKey, endpoint);
    populateModels(kind, models.length ? models : PROVIDERS[provider].presets);
    showStatus('模型列表已更新。', 'success');
  } catch (error) {
    populateModels(kind, PROVIDERS[provider].presets);
    showStatus(`获取失败，已显示预设模型：${error.message}`, 'error');
  }
}

async function loadModelsFromApi(provider, apiKey, endpoint) {
  const config = PROVIDERS[provider];
  let url = config.modelsEndpoint;

  if (provider === 'custom') {
    if (!endpoint.includes('chat/completions')) return [];
    url = endpoint.replace('chat/completions', 'models');
  }

  if (!url) return config.presets;

  const headers = { 'Content-Type': 'application/json' };
  if (provider === 'google') {
    url = `${url}?key=${encodeURIComponent(apiKey)}`;
  } else {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  const response = await fetch(url, { method: 'GET', headers });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return parseModels(await response.json());
}

function parseModels(data) {
  if (Array.isArray(data.data)) {
    return data.data
      .map((model) => ({ id: model.id, name: model.id }))
      .filter((model) => model.id && !/embedding|whisper|tts|dall-e/i.test(model.id))
      .sort((a, b) => a.id.localeCompare(b.id));
  }

  if (Array.isArray(data.models)) {
    return data.models.map((model) => {
      const id = (model.name || '').replace(/^models\//, '');
      return { id, name: model.displayName || id };
    }).filter((model) => model.id);
  }

  return [];
}

function populateModels(kind, models) {
  const select = $(`${kind}ModelSelect`);
  select.innerHTML = '';

  if (!models.length) {
    select.innerHTML = '<option value="">请手动填写模型 Code</option>';
    return;
  }

  models.forEach((model) => {
    const option = document.createElement('option');
    option.value = model.id;
    option.textContent = model.name || model.id;
    select.appendChild(option);
  });
}

function testApi(kind) {
  const label = kind === 'text' ? '文字 API' : '截图 API';
  const payload = {
    action: 'testAPI',
    apiProvider: $(`${kind}ApiProvider`).value,
    apiKey: $(`${kind}ApiKey`).value.trim(),
    apiEndpoint: $(`${kind}ApiEndpoint`).value.trim(),
    model: getModelValue(kind),
    maxTokens: 100,
    temperature: 0.7
  };

  if (!payload.apiKey) {
    showStatus(`请先填写${label} Key。`, 'error');
    return;
  }
  if (!payload.model) {
    showStatus(`请先选择或填写${label}模型。`, 'error');
    return;
  }

  showStatus(`正在测试${label}...`, 'success');
  chrome.runtime.sendMessage(payload, (response) => {
    if (response && response.success) {
      showStatus(`${label}连接成功。`, 'success');
    } else {
      showStatus(`${label}连接失败：${response ? response.error : '未知错误'}`, 'error');
    }
  });
}

function copyTextToImage() {
  $('imageApiProvider').value = $('textApiProvider').value;
  updateProviderUi('image');
  $('imageApiKey').value = $('textApiKey').value;
  $('imageApiEndpoint').value = $('textApiEndpoint').value;
  $('imageModelManual').value = getModelValue('text');
  showStatus('已复制文字配置到截图配置，请确认该模型是否支持图片。', 'success');
}

function updateSetupState() {
  const hasText = $('textApiKey').value.trim() && getModelValue('text');
  const hasImage = $('imageApiKey').value.trim() && getModelValue('image');
  const state = $('setupState');
  if (hasText || hasImage) {
    state.textContent = hasText && hasImage ? '文字和截图已配置' : '已完成部分配置';
    state.classList.add('ready');
  } else {
    state.textContent = '未完成配置';
    state.classList.remove('ready');
  }
}

function showStatus(message, type) {
  const status = $('status');
  status.textContent = message;
  status.className = `status ${type}`;
  window.clearTimeout(showStatus.timer);
  showStatus.timer = window.setTimeout(() => {
    status.className = 'status';
  }, 3600);
}
