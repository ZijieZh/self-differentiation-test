# self-differentiation-test

自我分化问卷（DSI）网页版 —— 基于 Bowen 家庭系统理论的在线心理测评工具。

## 在线体验

用浏览器直接打开 `index.html` 即可使用，无需服务器或构建工具。

```
dsi-config.js -- 维度、满分和方向配置
index.html    -- 问卷页（41题，6点量表）
report.html   -- 结果页（雷达图、环形图、维度分析）
```

## 截图

**问卷页**
- 顶部实时进度条（sticky）
- 4 个维度分块：情绪反应、情感切断、核心自我、人际融合
- 每题选项带分值提示，选中即自动记录

**报告页**
- 总分环形图（带动画）
- 四维度雷达图（统一健康度指数）
- 得分卡片 + 明细表格 + 计分说明板块
- 维度深度分析 + 综合成长建议
- Kimi AI 个性化深度解读（自动生成）
- 支持打印

## 量表说明

| 维度 | 题数 | 计分方式 | 得分范围 |
|------|------|----------|----------|
| 情绪反应（ER） | 10 | 反向题（除第2、10题） | 10-60 |
| 情感切断（EC） | 12 | 反向题（除第12题） | 12-72 |
| 核心自我（IP） | 10 | 正向题（除第4、9题反向） | 10-60 |
| 人际融合（FO） | 9 | 反向题（除第9题正向） | 9-54 |

总分满分 **246** 分。得分仅供参考，不构成临床诊断。

### 计分说明（重要）

**高分不代表"优秀"**。DSI 量表测量的是心理特征的**明显程度**，而非健康水平：

- **情绪反应（ER）**、**情感切断（EC）**、**人际融合（FO）**：得分高 = 该特征更明显（非正向）
- **核心自我（IP）**：得分高 = 自我认同感更强（唯一正向维度）

因此，总分越高并不代表自我分化越好，而是代表各维度特征的综合明显程度。报告页已增加直观的特征描述标签（如"情绪反应较强"）和计分说明板块，避免误解。

## 技术栈

- 纯 HTML/CSS/JavaScript，无框架
- [Chart.js](https://www.chartjs.org/)（CDN，精确版本 `@4.4.4`）渲染图表
- localStorage 存储答题数据（用于本机报告生成）
- Netlify Functions 代理调用 [Kimi AI](https://platform.moonshot.cn/)（Moonshot API）生成个性化深度分析报告

## 本地运行

```bash
# 任意 HTTP 服务器均可
python -m http.server 8080
# 然后打开 http://localhost:8080
```

或者直接双击 `index.html` 用浏览器打开。

## Netlify 部署

项目可直接部署到 Netlify。AI 深度解读依赖 `netlify/functions/kimi.js` 代理 Moonshot API，部署后需要在 Netlify 后台配置环境变量：

```
MOONSHOT_API_KEY=你的 Moonshot API Key
```

配置路径：Site configuration -> Environment variables。保存后重新部署。前端会请求 `/.netlify/functions/kimi`，不再从浏览器直接请求 Moonshot API。报告页使用 `moonshot-v1-8k`，并将前端等待时间控制在 55 秒内，以适配 Netlify 同步函数的执行时限。

## 数据采集与隐私说明

基础答题结果会存储在当前浏览器的 localStorage 中，用于在 `report.html` 生成本机报告。关闭浏览器不会自动删除这些数据，清除浏览器站点数据后报告不可恢复。

报告页会通过 Netlify Function 调用 Moonshot/Kimi API 生成个性化深度解读。调用时会把四个维度的测试得分、满分、占比、维度标签和总分说明发送到 Moonshot API，不发送姓名、联系方式等身份信息。继续使用本工具并打开报告页，即视为你已了解并同意上述数据采集与发送方式，使用即视为同意。

## 引用

- Bowen, M. (1978). *Family therapy in clinical practice*. Jason Aronson.
- Skowron, E. A., & Schmitt, T. A. (2003). The Differentiation of Self Inventory: Development and initial validation. *Journal of Counseling Psychology*, 50(1), 80-91.

## License

MIT
