import express from 'express';

const app = express();
const PORT = Number(process.env.API_PORT) || 4000;
app.use(express.json({ limit: '100kb' }));

let books = [
  { id: 1, title: 'The Alchemist', author: 'Paulo Coelho', price: 12.99, category: 'Fiction' },
  { id: 2, title: 'Clean Code', author: 'Robert C. Martin', price: 35.5, category: 'Programming' },
  { id: 3, title: 'Atomic Habits', author: 'James Clear', price: 18.0, category: 'Self-help' }
];
let nextId = Math.max(...books.map((book) => book.id)) + 1;

function validateBook(input, { partial = false } = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return 'Request body must be a JSON object';
  const fields = ['title', 'author', 'price', 'category'];
  for (const field of fields) {
    if (partial && !(field in input)) continue;
    if (!(field in input)) return `Missing required field: ${field}`;
    if (field === 'price') {
      if (typeof input.price !== 'number' || !Number.isFinite(input.price) || input.price < 0) return 'price must be a non-negative number';
    } else if (typeof input[field] !== 'string' || input[field].trim() === '') {
      return `${field} must be a non-empty string`;
    }
  }
  if (partial && !fields.some((field) => field in input)) return 'Provide at least one book field to update';
  return null;
}

app.get('/', (_req, res) => res.json({ message: 'Welcome to the Library Book Management API', endpoints: ['/books', '/books/:id'] }));
app.get('/books', (_req, res) => res.json(books));
app.get('/books/:id', (req, res) => {
  const book = books.find((record) => record.id === Number(req.params.id));
  if (!book) return res.status(404).json({ error: 'Book not found' });
  return res.json(book);
});
app.post('/books', (req, res) => {
  const validationError = validateBook(req.body);
  if (validationError) return res.status(400).json({ error: validationError });
  const book = { id: nextId++, title: req.body.title.trim(), author: req.body.author.trim(), price: req.body.price, category: req.body.category.trim() };
  books.push(book);
  return res.status(201).json({ message: 'Book added successfully', book });
});
app.put('/books/:id', (req, res) => {
  const index = books.findIndex((record) => record.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'Book not found' });
  const validationError = validateBook(req.body, { partial: true });
  if (validationError) return res.status(400).json({ error: validationError });
  const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => ['title', 'author', 'price', 'category'].includes(key)));
  for (const field of ['title', 'author', 'category']) if (field in updates) updates[field] = updates[field].trim();
  books[index] = { ...books[index], ...updates };
  return res.json({ message: 'Book updated successfully', book: books[index] });
});
app.delete('/books/:id', (req, res) => {
  const index = books.findIndex((record) => record.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'Book not found' });
  const [book] = books.splice(index, 1);
  return res.json({ message: 'Book deleted successfully', book });
});
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((error, _req, res, _next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) return res.status(400).json({ error: 'Invalid JSON request body' });
  console.error('API error:', error);
  return res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => console.log(`EchoAPI listening at http://localhost:${PORT}`));
