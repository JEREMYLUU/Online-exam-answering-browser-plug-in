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
        'temperature', 'showFloatingIcon', 'fastMode',
        'textApiProvider', 'textApiKey', 'textApiEndpoint', 'textModel', 'textMaxTokens', 'textTemperature',
        'imageApiProvider', 'imageApiKey', 'imageApiEndpoint', 'imageModel', 'imageMaxTokens', 'imageTemperature'
      ], (result) => {
        const textApiProvider = result.textApiProvider || result.apiProvider || 'deepseek';
        const textApiKey = result.textApiKey || result.apiKey || '';
        const textApiEndpoint = result.textApiEndpoint || result.apiEndpoint || 'https://api.deepseek.com/chat/completions';
        const textModel = result.textModel || result.model || 'deepseek-chat';
        const textMaxTokens = result.textMaxTokens || result.maxTokens || 1500;
        const textTemperature = result.textTemperature || result.temperature || 1.0;
        const imageApiProvider = result.imageApiProvider || 'google';
        const imageApiEndpoint = result.imageApiEndpoint || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

        this.settings = { 
          ...this.settings, 
          ...result,
          textApiProvider,
          textApiKey,
          textApiEndpoint,
          textModel,
          textMaxTokens,
          textTemperature,
          imageApiProvider,
          imageApiKey: result.imageApiKey || '',
          imageApiEndpoint,
          imageModel: result.imageModel || 'gemini-2.5-flash',
          imageMaxTokens: result.imageMaxTokens || 2500,
          imageTemperature: result.imageTemperature || 0.7,
          fastMode: result.fastMode !== undefined ? result.fastMode : true,
          apiProvider: textApiProvider,
          apiKey: textApiKey,
          apiEndpoint: textApiEndpoint,
          model: textModel,
          maxTokens: textMaxTokens,
          temperature: textTemperature
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
    this.screenshotButton = document.createElement('div');
    this.screenshotButton.className = 'screenshot-button';
    this.screenshotButton.title = '截图识题 (按住拖动)';
    this.screenshotButton.innerHTML = '📷 截图识题';
    
    // 恢复上次的位置
    const savedPos = localStorage.getItem('screenshotBtnPos');
    if (savedPos) {
      const { top, right } = JSON.parse(savedPos);
      if (top) this.screenshotButton.style.top = top;
      if (right) this.screenshotButton.style.right = right;
      // 如果有左/底定位也兼容，但css默认是top/right，这里简化处理
    }

    document.body.appendChild(this.screenshotButton);
    
    // 绑定点击和拖拽
    this.bindDraggableButton(this.screenshotButton);
  }

  // 绑定拖拽和点击逻辑
  bindDraggableButton(element) {
    let isDragging = false;
    let startX, startY;
    let initialRight, initialTop;
    
    // 鼠标按下
    element.addEventListener('mousedown', (e) => {
      isDragging = false;
      startX = e.clientX;
      startY = e.clientY;
      
      const rect = element.getBoundingClientRect();
      // 转换为 right/top 坐标系
      initialRight = document.documentElement.clientWidth - rect.right;
      initialTop = rect.top;
      
      // 阻止默认选择
      e.preventDefault();
      
      // 绑定全局移动和释放
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });

    const onMouseMove = (e) => {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      
      // 稍微移动一点就算拖拽
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        isDragging = true;
        element.style.cursor = 'grabbing';
        
        // 计算新位置
        let newRight = initialRight - dx;
        let newTop = initialTop + dy;
        
        // 边界限制
        const maxRight = document.documentElement.clientWidth - element.offsetWidth;
        const maxTop = document.documentElement.clientHeight - element.offsetHeight;
        
        newRight = Math.max(0, Math.min(newRight, maxRight));
        newTop = Math.max(0, Math.min(newTop, maxTop));
        
        element.style.right = `${newRight}px`;
        element.style.top = `${newTop}px`;
      }
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      element.style.cursor = 'pointer';
      
      if (isDragging) {
        // 保存位置
        localStorage.setItem('screenshotBtnPos', JSON.stringify({
          top: element.style.top,
          right: element.style.right
        }));
      } else {
        // 没拖拽，视为点击
        this.handleScreenshotClick();
      }
    };
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
    if (!this.settings.imageApiKey) {
      this.showAnswerDisplay();
      this.showError('请先在插件设置中配置“截图识题 API Key”。截图识题必须使用支持图片的模型，例如 Gemini、Qwen-VL、GLM-4V、Pixtral、GPT-4o。');
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
    // 用户要求默认放行所有模型
    // 即使模型不支持，API 也会返回错误，让 API 来拒绝比前端写死判断更灵活
    return true;
  }
  
  // 处理按钮点击
  async handleButtonClick() {
    if (this.isLoading) return;
    
    if (!this.selectedText) {
      this.showError('请先选择题目文本');
      return;
    }
    
    if (!this.settings.textApiKey) {
      this.showError('请先在插件设置中配置“文字搜题 API Key”。文字搜题可以使用 DeepSeek、Qwen、Groq、Kimi 等文本模型。');
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
          apiProvider: this.settings.imageApiProvider,
          apiKey: this.settings.imageApiKey,
          apiEndpoint: this.settings.imageApiEndpoint,
          model: this.settings.imageModel,
          maxTokens: this.settings.imageMaxTokens,
          temperature: this.settings.imageTemperature,
          fastMode: this.settings.fastMode
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
          apiProvider: this.settings.textApiProvider,
          apiKey: this.settings.textApiKey,
          apiEndpoint: this.settings.textApiEndpoint,
          model: this.settings.textModel,
          maxTokens: this.settings.textMaxTokens,
          temperature: this.settings.textTemperature,
          fastMode: this.settings.fastMode
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
