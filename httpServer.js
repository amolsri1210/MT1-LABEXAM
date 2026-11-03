import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.HTTP_PORT) || 3000;

const books = [
  { id: 1, title: 'The Alchemist', author: 'Paulo Coelho', price: 12.99, category: 'Fiction' },
  { id: 2, title: 'Clean Code', author: 'Robert C. Martin', price: 35.5, category: 'Programming' },
  { id: 3, title: 'Atomic Habits', author: 'James Clear', price: 18.0, category: 'Self-help' }
];
const mimeTypes = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8' };

function sendJson(res, status, value) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(value, null, 2));
}

async function readJsonBody(req) {
  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 100_000) throw Object.assign(new Error('Request body too large'), { statusCode: 413 });
  }
  try {
    return JSON.parse(body);
  } catch {
    throw Object.assign(new Error('Invalid JSON request body'), { statusCode: 400 });
  }
}

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
  const pathname = decodeURIComponent(requestUrl.pathname);

  if (req.method === 'POST' && pathname === '/add-book') {
    let newBook;
    try {
      newBook = await readJsonBody(req);
    } catch (error) {
      return sendJson(res, error.statusCode ?? 400, { error: error.message });
    }
    if (!newBook || typeof newBook !== 'object' || Array.isArray(newBook)) {
      return sendJson(res, 400, { error: 'Request body must be a JSON object' });
    }
    const { id, title, author, price } = newBook;
    if (!Number.isInteger(id) || id < 1 || typeof title !== 'string' || !title.trim() ||
        typeof author !== 'string' || !author.trim() || typeof price !== 'number' || !Number.isFinite(price) || price < 0) {
      return sendJson(res, 400, { error: 'Required fields: positive integer id, non-empty title and author, and non-negative numeric price' });
    }
    if (books.some((book) => book.id === id)) return sendJson(res, 409, { error: 'A book with this id already exists' });
    const book = { id, title: title.trim(), author: author.trim(), price, category: typeof newBook.category === 'string' && newBook.category.trim() ? newBook.category.trim() : 'Uncategorized' };
    books.push(book);
    return sendJson(res, 201, { message: 'Book added successfully', book });
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  if (pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end('<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Library Book Management</title></head><body><main><h1>Library Book Management</h1><p>Welcome! This Node.js HTTP server is running.</p><nav><a href="/books">View books (JSON)</a> · <a href="/about">About</a> · <a href="/home">Home page (FS module)</a></nav></main></body></html>');
  }
  if (pathname === '/books') return sendJson(res, 200, books);
  if (pathname === '/about') return sendJson(res, 200, { application: 'Library Book Management', server: 'Node.js built-in HTTP module', port: PORT });

  if (pathname === '/home' || pathname.startsWith('/public/')) {
    const relativePath = pathname === '/home' ? 'public/index.html' : pathname.slice(1);
    const targetPath = path.resolve(__dirname, relativePath);
    const allowedRoot = path.resolve(__dirname, 'public') + path.sep;
    if (pathname !== '/home' && !targetPath.startsWith(allowedRoot)) return sendJson(res, 403, { error: 'Forbidden' });
    try {
      const content = await readFile(targetPath);
      res.writeHead(200, { 'Content-Type': mimeTypes[path.extname(targetPath)] ?? 'application/octet-stream' });
      return res.end(req.method === 'HEAD' ? undefined : content);
    } catch (error) {
      if (error.code === 'ENOENT' || error.code === 'EISDIR') return sendJson(res, 404, { error: 'Page or file not found' });
      console.error('Unable to read requested file:', error);
      return sendJson(res, 500, { error: 'Unable to read requested file' });
    }
  }
  return sendJson(res, 404, { error: 'Route not found' });
});

server.listen(PORT, () => console.log(`HTTP server listening at http://localhost:${PORT}`));
server.on('error', (error) => { console.error('HTTP server failed:', error.message); process.exitCode = 1; });
