# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

自我分化问卷（DSI）网页版 —— 纯静态 HTML/CSS/JavaScript 心理测评工具，基于 Bowen 家庭系统理论。部署于 GitHub Pages（`zijiezh.github.io/self-differentiation-test`），无构建工具、无框架、无后端。

> 项目路径：`C:/AI/exes/self-differentiation-test`（已从 `C:/AI/self-differentiation-test` 迁移至此）

## Architecture

### 页面结构
- `dsi-config.js` — 共享维度配置（维度名、满分、题数、方向）
- `index.html` — 问卷页（41 题，6 点量表，4 个可折叠维度卡片）
- `report.html` — 结果页（环形图、雷达图、维度分析、AI 深度解读）
- `README.md` — 量表计分规则和技术说明

### 跨页数据流
`index.html` → `localStorage.setItem('dsi_scores')` / `localStorage.setItem('dsi_date')` → `report.html` 读取并渲染。`report.html` 无数据时显示"暂无数据"引导页。

### 计分逻辑（易混淆）
DSI 量表的特殊之处在于：**高分不代表"优秀"**，而是测量心理特征的**明显程度**：

| 维度 | 方向 | 高分含义 |
|------|------|----------|
| ER（情绪反应） | 反向 | 情绪波动大、容易被影响 |
| EC（情感切断） | 反向 | 亲密关系中容易疏远/逃避 |
| IP（核心自我） | **正向** | 自我认同感强、能坚持自己 |
| FO（人际融合） | 反向 | 容易被家庭情绪卷入 |

- 选项 0-5 映射到 1-6 分，`reverse: true` 的题目用 `(6 - index)` 计分
- 总分 246 分，**不是越高越好**
- `getLevel()` 返回维度特征描述（如"情绪反应较强"），而非"偏高/偏低"

### AI 深度分析
`report.html` 页面加载时自动调用 Netlify Function（`/.netlify/functions/kimi`），由函数代理 Moonshot Kimi API（`api.moonshot.cn/v1/chat/completions`）：
- API key 存储在 Netlify 环境变量 `MOONSHOT_API_KEY`，不要写入前端源码
- 模型固定为 `moonshot-v1-8k`，`temperature: 0.7`，`max_tokens: 2048`
- 55 秒 fetch 超时（AbortController），用于适配 Netlify 同步函数执行时限
- GitHub Pages 静态托管无法运行 Netlify Function，AI 解读应在 Netlify 部署地址测试

### 移动端关键实现
- 选项每行 3 个：`flex: 0 0 calc(33.333% - 3px)`
- 折叠动画用 CSS Grid：`grid-template-rows: 1fr` ↔ `0fr`，无 max-height 限制
- 进度条 `position: sticky`

## 常用命令

```bash
# 本地预览（任意 HTTP 服务器均可）
python -m http.server 8080
# 打开 http://localhost:8080

# GitHub Pages 部署
# 推送 master 分支后自动部署，1-2 分钟后生效
git push origin master

# 无 build、无 test、no lint —— 纯静态文件
```

## 修改注意事项

1. **修改维度配置优先改 `dsi-config.js`**：维度名、满分、题数、方向集中在共享配置中；`getLevel()` 的标签和 `getPrompt()` 的评分说明仍需保持一致，避免 AI 输出与用户看到的标签矛盾。
2. **API key 更新**：在 Netlify 后台更新 `MOONSHOT_API_KEY` 环境变量，不要写入前端源码。
3. **CDN 缓存**：Chart.js 使用精确版本号 `@4.4.4`，升级时同步更新版本。
4. **跳转参数**：`index.html` 提交后跳转带 `?v=N` 参数用于缓存清除，修改时递增版本号。
