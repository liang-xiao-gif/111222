const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { pathToFileURL } = require('node:url');
const { spawn } = require('node:child_process');

const root = __dirname;
const port = Number(process.env.PORT || 3000);

async function loadEnvFile() {
  try {
    const content = await fs.readFile(path.join(root, '.env'), 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
      }
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

function sendJson(response, status, payload) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
}

function getRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
      if (body.length > 100000) {
        reject(new Error('请求内容过大'));
        request.destroy();
      }
    });
    request.on('end', () => resolve(body));
    request.on('error', reject);
  });
}

function parseMultipart(request, body, contentType) {
  const match = contentType.match(/boundary=([^;]+)/i);
  if (!match) throw new Error('缺少 multipart boundary');
  const boundary = '--' + match[1].replace(/^"|"$/g, '');
  const parts = body.split(boundary).slice(1, -1);
  const fields = {};
  const files = [];
  for (const part of parts) {
    const trimmed = part.replace(/^\r?\n/, '').replace(/\r?\n--$/, '');
    const headerEnd = trimmed.indexOf('\r\n\r\n');
    if (headerEnd === -1) continue;
    const headerText = trimmed.slice(0, headerEnd);
    const content = trimmed.slice(headerEnd + 4).replace(/\r?\n$/, '');
    const disposition = headerText.match(/name="([^"]+)"(?:;\s*filename="([^"]+)")?/i);
    if (!disposition) continue;
    const name = disposition[1];
    const filename = disposition[2];
    if (filename) {
      files.push({
        field: name,
        filename,
        contentType: (headerText.match(/Content-Type:\s*([^\r\n]+)/i) || [])[1] || 'application/octet-stream',
        buffer: Buffer.from(content, 'binary')
      });
    } else {
      fields[name] = content;
    }
  }
  return { fields, files };
}

function getLibreOfficeCommand() {
  return process.env.OPENOFFICE_CMD || process.env.LIBREOFFICE_CMD || 'F:\\LibreOffice\\program\\soffice.exe';
}

async function convertWithOffice(inputPath, outputDir) {
  // LibreOffice may hang when its normal desktop profile is already in use.
  // Give each conversion an isolated temporary profile instead.
  const profileDir = path.join(outputDir, 'libreoffice-profile');
  await fs.mkdir(profileDir, { recursive: true });
  const profileUrl = pathToFileURL(profileDir).href;
  return new Promise((resolve, reject) => {
    const command = getLibreOfficeCommand();
    const args = [
      `-env:UserInstallation=${profileUrl}`,
      '--headless', '--nologo', '--nolockcheck', '--nodefault',
      '--convert-to', 'pdf', '--outdir', outputDir, inputPath
    ];
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';
    let stdout = '';
    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error('LibreOffice 转换超时（120 秒）。请关闭所有 LibreOffice 窗口后重试。'));
    }, 120000);
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.on('close', (code) => {
      clearTimeout(timeout);
      if (code !== 0) {
        reject(new Error(stderr.trim() || `OpenOffice 转换失败，退出码 ${code}`));
        return;
      }
      resolve();
    });
  });
}

async function handleConvert(request, response) {
  const contentType = request.headers['content-type'] || '';
  if (!contentType.includes('multipart/form-data')) {
    sendJson(response, 400, { error: '请使用 multipart/form-data 上传文档' });
    return;
  }
  let body;
  try {
    body = await getRequestBody(request);
  } catch (error) {
    sendJson(response, 413, { error: error.message || '上传内容过大' });
    return;
  }
  try {
    const { fields, files } = parseMultipart(request, body, contentType);
    const file = files[0];
    if (!file) {
      sendJson(response, 400, { error: '没有收到文档文件' });
      return;
    }
    const ext = path.extname(file.filename).toLowerCase();
    if (!['.doc', '.docx'].includes(ext)) {
      sendJson(response, 400, { error: '只支持 .doc 或 .docx' });
      return;
    }
    const workDir = await fs.mkdtemp(path.join(os.tmpdir(), 'doc-to-pdf-'));
    const inputPath = path.join(workDir, file.filename);
    const outputName = (fields.outputName || path.basename(file.filename, ext) + '.pdf').replace(/[^\w.-]+/g, '_');
    const outputPath = path.join(workDir, outputName);
    await fs.writeFile(inputPath, file.buffer);
    try {
      await convertWithOffice(inputPath, workDir);
    } catch (error) {
      sendJson(response, 500, {
        error: error.message || 'OpenOffice 转换失败',
        hint: '请确认机器上已安装 LibreOffice/OpenOffice，并且 `F:\\LibreOffice\\program\\soffice.exe` 可执行，或者通过环境变量 `LIBREOFFICE_CMD` 指向正确的 soffice 路径。'
      });
      return;
    }
    const pdfName = path.basename(inputPath, ext) + '.pdf';
    const finalPath = path.join(workDir, pdfName);
    const pdf = await fs.readFile(finalPath);
    response.writeHead(200, {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${outputName.replace(/\.pdf$/i, '')}.pdf"`
    });
    response.end(pdf);
  } catch (error) {
    sendJson(response, 500, { error: error.message || '转换服务发生错误' });
  }
}

async function handleChat(request, response) {
  if (!process.env.GEMINI_API_KEY) {
    sendJson(response, 500, { error: '未配置 GEMINI_API_KEY。请在 .env 中设置后重启服务。' });
    return;
  }
  try {
    const payload = JSON.parse(await getRequestBody(request));
    const messages = Array.isArray(payload.messages) ? payload.messages.slice(-12) : [];
    if (!messages.length || messages.some((message) => !['user', 'assistant'].includes(message.role) || typeof message.text !== 'string')) {
      sendJson(response, 400, { error: '消息格式无效。' });
      return;
    }

    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent';
    const geminiResponse = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: '你是 CodeGuard AI，一名严谨的中文代码评审助手。优先指出安全性、可靠性、性能和可维护性问题；回答清晰、可操作，并在不确定时说明假设。' }]
        },
        contents: messages.map((message) => ({
          role: message.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: message.text }]
        })),
        generationConfig: { temperature: 0.35, maxOutputTokens: 1200 }
      })
    });

    const data = await geminiResponse.json();
    if (!geminiResponse.ok) {
      sendJson(response, geminiResponse.status, { error: data.error?.message || 'Gemini API 请求失败。' });
      return;
    }
    const reply = data.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim();
    if (!reply) {
      sendJson(response, 502, { error: 'Gemini 未返回可显示的文本。' });
      return;
    }
    sendJson(response, 200, { reply });
  } catch (error) {
    sendJson(response, 500, { error: error.message || '本地服务发生错误。' });
  }
}

async function serveStatic(request, response) {
  const requestPath = new URL(request.url, 'http://' + request.headers.host).pathname;
  const relativePath = requestPath === '/' ? 'index.html' : decodeURIComponent(requestPath).replace(/^[/\\]+/, '');
  const filePath = path.resolve(root, relativePath);
  if (!filePath.startsWith(root + path.sep)) {
    response.writeHead(403);
    response.end('Forbidden');
    return;
  }
  try {
    const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };
    const content = await fs.readFile(filePath);
    response.writeHead(200, { 'Content-Type': types[path.extname(filePath)] || 'application/octet-stream' });
    response.end(content);
  } catch {
    response.writeHead(404);
    response.end('Not found');
  }
}

loadEnvFile().then(() => {
  const server = http.createServer((request, response) => {
    if (request.method === 'POST' && request.url === '/api/chat') {
      handleChat(request, response);
    } else if (request.method === 'POST' && request.url === '/api/convert') {
      handleConvert(request, response);
    } else if (request.method === 'GET') {
      serveStatic(request, response);
    } else {
      response.writeHead(405);
      response.end('Method not allowed');
    }
  });
  server.listen(port, () => console.log('CodeGuard AI is running at http://localhost:' + port));
});
