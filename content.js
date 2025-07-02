// 内容脚本 - 在网页中运行
class QuestionHelper {
  constructor() {
    this.settings = {
      apiKey: '',
      showFloatingIcon: true
    };
    this.floatingButton = null;
    this.screenshotButton = null;
    this.answerDisplay = null;
    this.selectedText = '';
    this.isLoading = false;
    
    this.init();
  }
  
  // 初始化
  async init() {
    await this.loadSettings();
    this.createFloatingButton();
    this.createScreenshotButton();
    this.createAnswerDisplay();
    this.bindEvents();
    
    // 延迟显示截图按钮，避免页面加载时闪烁
    setTimeout(() => {
      this.showScreenshotButton();
    }, 1000);
  }
  
  // 加载设置
  async loadSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get([
        'apiProvider', 'apiKey', 'apiEndpoint', 'model', 'maxTokens', 
        'temperature', 'showFloatingIcon'
      ], (result) => {
        this.settings = { 
          ...this.settings, 
          ...result,
          apiProvider: result.apiProvider || 'novita',
          apiEndpoint: result.apiEndpoint || 'https://api.novita.ai/v3/openai/chat/completions',
          model: result.model || 'minimaxai/minimax-m1-80k',
          maxTokens: result.maxTokens || 20000,
          temperature: result.temperature || 0.7
        };
        resolve();
      });
    });
  }
  
  // 创建浮动按钮
  createFloatingButton() {
    this.floatingButton = document.createElement('button');
    this.floatingButton.className = 'question-helper-button';
    this.floatingButton.title = '点击获取答案';
    this.floatingButton.type = 'button';
    document.body.appendChild(this.floatingButton);
    
    // 点击事件
    this.floatingButton.addEventListener('click', () => {
      this.handleButtonClick();
    });
  }
  
  // 创建截图按钮
  createScreenshotButton() {
    this.screenshotButton = document.createElement('button');
    this.screenshotButton.className = 'screenshot-button';
    this.screenshotButton.title = '截图识题';
    this.screenshotButton.type = 'button';
    this.screenshotButton.innerHTML = '📷 截图识题';
    document.body.appendChild(this.screenshotButton);
    
    // 点击事件
    this.screenshotButton.addEventListener('click', () => {
      this.handleScreenshotClick();
    });
  }
  
  // 创建答案显示框
  createAnswerDisplay() {
    this.answerDisplay = document.createElement('div');
    this.answerDisplay.className = 'answer-display';
    this.answerDisplay.innerHTML = `
      <div class="answer-header">
        <h3>搜题答案助手</h3>
        <button class="answer-close" title="关闭">&times;</button>
      </div>
      <div class="answer-content">
        <div class="answer-loading">正在分析题目...</div>
      </div>
    `;
    document.body.appendChild(this.answerDisplay);
    
    // 关闭按钮事件
    const closeBtn = this.answerDisplay.querySelector('.answer-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // 阻止事件冒泡
        this.hideAnswerDisplay();
      });
    }
  }
  
  // 绑定事件
  bindEvents() {
    // 监听设置更新
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'updateSettings') {
        this.settings = { ...this.settings, ...request.settings };
        this.updateUI();
      }
    });
    
    // 监听文本选择
    document.addEventListener('mouseup', (e) => {
      this.handleTextSelection(e);
    });
    
    // 监听键盘快捷键
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'Q') {
        e.preventDefault();
        this.handleButtonClick();
      }
      
      // ESC键关闭答案显示框
      if (e.key === 'Escape') {
        this.hideAnswerDisplay();
      }
    });
  }
  
  // 处理文本选择
  handleTextSelection(e) {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    if (selectedText.length > 10 && selectedText.length < 1000) {
      this.selectedText = selectedText;
      this.showFloatingButton(e.clientX, e.clientY);
    } else {
      this.hideFloatingButton();
    }
  }
  
  // 显示浮动按钮
  showFloatingButton(x, y) {
    if (!this.settings.showFloatingIcon) return;
    
    this.floatingButton.style.left = (x + 10) + 'px';
    this.floatingButton.style.top = (y - 25) + 'px';
    this.floatingButton.classList.add('visible');
  }
  
  // 隐藏浮动按钮
  hideFloatingButton() {
    this.floatingButton.classList.remove('visible');
  }
  
  // 显示截图按钮
  showScreenshotButton() {
    this.screenshotButton.classList.add('visible');
  }
  
  // 隐藏截图按钮
  hideScreenshotButton() {
    this.screenshotButton.classList.remove('visible');
  }
  
  // 处理截图按钮点击
  async handleScreenshotClick() {
    if (this.isLoading) return;
    if (!this.settings.apiKey) {
      this.showError('请先在插件设置中配置API Key');
      return;
    }
    if (!this.isImageSupported()) {
      this.showError('当前选择的API模型不支持图片输入，请选择支持图片的模型（如GPT-4 Vision、Claude 3 Haiku、Gemini Pro Vision等）');
      return;
    }
    try {
      this.showAnswerDisplay();
      this.showLoading('正在截取网页...');
      // 直接全屏截图
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: 'takeScreenshot' }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      });
      if (response.success) {
        this.showLoading('正在分析截图中的题目...');
        await this.getAnswerFromImage(response.imageData);
      } else {
        this.showError(response.error || '截图失败');
      }
    } catch (error) {
      this.showError('截图功能错误: ' + error.message);
    }
  }
  
  // 检查API是否支持图片输入
  isImageSupported() {
    // 动态检查模型是否支持图片
    const imageKeywords = ['vision', 'gpt-4o', 'gpt-4o-mini', 'claude-3', 'gemini-1.5', 'gemini-2.0', 'gemini-2.5', 'minimax'];
    
    // 检查模型名称是否包含图片支持的关键词
    const modelLower = this.settings.model.toLowerCase();
    return imageKeywords.some(keyword => modelLower.includes(keyword.toLowerCase()));
  }
  
  // 处理按钮点击
  async handleButtonClick() {
    if (this.isLoading) return;
    
    if (!this.selectedText) {
      this.showError('请先选择题目文本');
      return;
    }
    
    if (!this.settings.apiKey) {
      this.showError('请先在插件设置中配置API Key');
      return;
    }
    
    await this.getAnswer(this.selectedText);
  }
  
  // 从图片获取答案
  async getAnswerFromImage(imageData) {
    this.isLoading = true;
    
    try {
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          action: 'getAnswerFromImage',
          imageData: imageData,
          apiProvider: this.settings.apiProvider,
          apiKey: this.settings.apiKey,
          apiEndpoint: this.settings.apiEndpoint,
          model: this.settings.model,
          maxTokens: this.settings.maxTokens,
          temperature: this.settings.temperature
        }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      });
      
      if (response.success) {
        this.showAnswer('截图中的题目', response.answer);
      } else {
        this.showError(response.error || '获取答案失败');
      }
    } catch (error) {
      this.showError('网络错误: ' + error.message);
    } finally {
      this.isLoading = false;
    }
  }
  
  // 获取答案
  async getAnswer(question) {
    this.isLoading = true;
    this.showAnswerDisplay();
    this.showLoading();
    
    try {
      const response = await new Promise((resolve, reject) => {
        // 检查扩展是否仍然有效
        if (!chrome.runtime || !chrome.runtime.sendMessage) {
          reject(new Error('扩展上下文已失效，请刷新页面'));
          return;
        }
        
        chrome.runtime.sendMessage({
          action: 'getAnswer',
          question: question,
          apiProvider: this.settings.apiProvider,
          apiKey: this.settings.apiKey,
          apiEndpoint: this.settings.apiEndpoint,
          model: this.settings.model,
          maxTokens: this.settings.maxTokens,
          temperature: this.settings.temperature
        }, (response) => {
          if (chrome.runtime.lastError) {
            const error = chrome.runtime.lastError;
            if (error.message.includes('Extension context invalidated')) {
              reject(new Error('扩展已重新加载，请刷新页面'));
            } else {
              reject(new Error(error.message));
            }
          } else {
            resolve(response);
          }
        });
      });
      
      if (response.success) {
        this.showAnswer(question, response.answer);
      } else {
        this.showError(response.error || '获取答案失败');
      }
    } catch (error) {
      this.showError('网络错误: ' + error.message);
    } finally {
      this.isLoading = false;
    }
  }
  
  // 显示答案显示框
  showAnswerDisplay() {
    this.answerDisplay.classList.add('show');
  }
  
  // 隐藏答案显示框
  hideAnswerDisplay() {
    this.answerDisplay.classList.remove('show');
  }
  
  // 显示加载状态
  showLoading(message = '正在分析题目并生成答案...') {
    const content = this.answerDisplay.querySelector('.answer-content');
    content.innerHTML = `<div class="answer-loading">${message}</div>`;
  }
  
  // 显示答案
  showAnswer(question, answer) {
    const content = this.answerDisplay.querySelector('.answer-content');
    content.innerHTML = `
      <h4>题目：</h4>
      <p>${this.escapeHtml(question)}</p>
      <h4>答案：</h4>
      <p>${this.formatAnswer(answer)}</p>
    `;
  }
  
  // 显示错误
  showError(message) {
    const content = this.answerDisplay.querySelector('.answer-content');
    content.innerHTML = `<div class="answer-error">${this.escapeHtml(message)}</div>`;
  }
  
  // 格式化答案
  formatAnswer(answer) {
    // 将换行符转换为HTML
    return this.escapeHtml(answer).replace(/\n/g, '<br>');
  }
  
  // HTML转义
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  // 更新UI
  updateUI() {
    if (!this.settings.showFloatingIcon) {
      this.hideFloatingButton();
    }
  }
}

// 初始化插件
new QuestionHelper(); 