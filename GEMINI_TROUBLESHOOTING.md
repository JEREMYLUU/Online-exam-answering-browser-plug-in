# Gemini API 故障排除指南

## 快速诊断工具

在开始故障排除之前，建议先使用我们提供的测试工具：

🔧 **[Gemini API 测试工具](test_gemini.html)** - 独立的测试页面，可以快速诊断API连接问题

## 常见问题及解决方案

### 1. 400 错误 - 请求参数错误

**症状**：收到 "HTTP error! status: 400" 错误
**最常见原因**：

#### 问题1：API Key 格式错误
**解决方案**：
1. 确保 API Key 以 "AIza" 开头
2. 检查 API Key 是否完整（通常39个字符）
3. 确保没有多余的空格或换行符

#### 问题2：API Key 未启用
**解决方案**：
1. 访问 [Google AI Studio](https://makersuite.google.com/app/apikey)
2. 确认 API Key 状态为"已启用"
3. 如果显示"已禁用"，点击启用

#### 问题3：未启用 Generative Language API
**解决方案**：
1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 选择您的项目
3. 进入 "API 和服务" → "库"
4. 搜索 "Generative Language API"
5. 点击启用

#### 问题4：账户配额不足
**解决方案**：
1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 检查 "配额" 页面
3. 确认有足够的免费配额或付费配额

### 2. 404 错误 - 模型未找到

**症状**：收到 "models/xxx is not found" 错误
**原因**：使用了不存在的模型名称或模型名称格式错误

**解决方案**：
1. **使用正确的模型名称**：
   - `gemini-1.5-flash`（推荐，支持图片和文本）
   - `gemini-1.5-pro`（支持图片和文本）
   - `gemini-pro`（仅支持文本）
   - `gemini-pro-vision`（支持图片和文本）

2. **检查模型可用性**：
   - 使用模型列表API查看可用模型
   - 确保模型名称拼写正确
   - 注意大小写和连字符

3. **更新插件配置**：
   - 确保插件使用最新的模型名称
   - 重新加载插件以应用更新

### 3. API Key 问题

#### 问题：API Key 无效或已过期
**症状**：收到 401 或 403 错误
**解决方案**：
1. 访问 [Google AI Studio](https://makersuite.google.com/app/apikey)
2. 登录您的 Google 账户
3. 点击 "Get API key" 创建新的 API Key
4. 确保 API Key 已启用且未过期
5. 复制完整的 API Key（以 "AIza" 开头）

#### 问题：API Key 权限不足
**症状**：收到 403 错误
**解决方案**：
1. 检查您的 Google Cloud 项目是否启用了 Gemini API
2. 访问 [Google Cloud Console](https://console.cloud.google.com/)
3. 选择您的项目
4. 在 "API 和服务" 中启用 "Generative Language API"
5. 确保您的账户有足够的配额

### 4. 网络连接问题

#### 问题：网络连接失败
**症状**：fetch 错误或超时
**解决方案**：
1. 检查网络连接是否正常
2. 确认防火墙未阻止请求
3. 尝试使用 VPN 或更换网络
4. 检查浏览器是否支持 fetch API

### 5. 请求格式问题

#### 问题：请求体格式错误
**症状**：400 错误
**解决方案**：
1. 确保请求体符合 Gemini API 格式
2. 检查 maxTokens 和 temperature 参数范围
3. 确保图片数据格式正确（base64 编码）

## 调试步骤

### 1. 使用测试工具
```bash
# 在浏览器中打开测试工具
file:///path/to/test_gemini.html
```

### 2. 检查 API Key
```javascript
// 在浏览器控制台中测试
const apiKey = 'YOUR_API_KEY';
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

fetch(url)
  .then(response => {
    console.log('状态码:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('响应数据:', data);
  })
  .catch(error => {
    console.error('错误:', error);
  });
```

### 3. 测试模型调用
```javascript
// 测试文本生成
const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
const testBody = {
  contents: [{
    parts: [{
      text: "Hello, this is a test message."
    }]
  }],
  generationConfig: {
    maxOutputTokens: 100,
    temperature: 0.7
  }
};

fetch(testUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(testBody)
})
.then(response => {
  console.log('状态码:', response.status);
  return response.json();
})
.then(data => {
  console.log('响应数据:', data);
})
.catch(error => {
  console.error('错误:', error);
});
```

## 常见错误代码

| 错误代码 | 含义 | 解决方案 |
|---------|------|----------|
| 400 | 请求参数错误 | 检查模型名称和请求体格式，验证API Key |
| 401 | 未授权 | 检查 API Key 是否正确 |
| 403 | 权限不足 | 检查 API 是否已启用 |
| 404 | 模型未找到 | 检查模型名称是否正确，使用可用的模型 |
| 429 | 请求过于频繁 | 等待一段时间后重试 |
| 500 | 服务器错误 | 稍后重试 |

## 400错误详细诊断

如果遇到400错误，请按以下步骤检查：

1. **API Key 验证**：
   - 长度：通常39个字符
   - 前缀：必须以"AIza"开头
   - 格式：不应包含空格或特殊字符

2. **API 启用状态**：
   - 在 Google AI Studio 中确认 API Key 已启用
   - 在 Google Cloud Console 中确认 Generative Language API 已启用

3. **账户状态**：
   - 检查账户是否有足够的配额
   - 确认账户未被暂停或限制

4. **网络环境**：
   - 如果在中国大陆，可能需要使用VPN
   - 检查防火墙是否阻止了API请求

## 获取帮助

如果问题仍然存在，请：

1. **使用测试工具**：先运行 `test_gemini.html` 进行诊断
2. **检查控制台日志**：打开浏览器开发者工具，查看 Console 标签页的错误信息
3. **验证 API Key**：在 Google AI Studio 中测试您的 API Key
4. **查看配额**：确认您的账户有足够的 API 调用配额
5. **联系支持**：访问 [Google AI Studio 支持页面](https://ai.google.dev/support)

## 最佳实践

1. **API Key 安全**：不要在代码中硬编码 API Key，使用环境变量
2. **错误处理**：始终实现适当的错误处理逻辑
3. **重试机制**：对于临时错误（如 429），实现指数退避重试
4. **监控使用量**：定期检查 API 使用量和配额
5. **模型选择**：根据需求选择合适的模型（文本 vs 图片）

## 相关链接

- [Google AI Studio](https://makersuite.google.com/app/apikey)
- [Gemini API 文档](https://ai.google.dev/docs)
- [Google Cloud Console](https://console.cloud.google.com/)
- [API 配额管理](https://console.cloud.google.com/apis/credentials)
- [测试工具](test_gemini.html) 