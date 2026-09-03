# CodeGuard AI

## 员工技术专长 API

运行 `npm start` 后，专长数据会持久化到 `data/employee-skills.json`。

- `GET /api/v1/employees/EMP001/skills`：读取技术专长
- `POST /api/v1/employees/EMP001/skills`：保存技术专长，请求体格式为 `{ "skills": ["Java", "Docker"] }`

## 启动 Gemini 对话

1. 从 .env.example 复制一份为 .env。
2. 在 .env 中填入你的 GEMINI_API_KEY。
3. 安装 Node.js 18 或更高版本。
4. 在项目目录运行：npm start
5. 在浏览器打开 http://localhost:3000，进入“AI 对话”即可使用 Gemini。

密钥只由本地服务读取，不会发送到浏览器。请不要将 .env 提交到版本库。
