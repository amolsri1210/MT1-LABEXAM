# MT1 Lab Exam: Library Book Management

Two independent Node.js ES module applications implement the lab requirements.

## Setup

```sh
npm install
```

## Run the built-in HTTP server (port 3000)

```sh
npm run start:http
```

Routes: `/` (HTML welcome), `/books` (book JSON), `/about` (application info), and `/home` (HTML loaded from `public/index.html` with the `fs` module). `POST /add-book` adds a book using the required JSON fields `id`, `title`, `author`, and `price`; `category` is optional. Files below `/public/` are also served as static files.

## Run EchoAPI (port 4000)

In a second terminal:

```sh
npm run start:api
```

| Method | Endpoint | Result |
| --- | --- | --- |
| GET | `/books` | List all books |
| GET | `/books/:id` | Fetch one book |
| POST | `/books` | Create a book (201) |
| PUT | `/books/:id` | Update provided fields |
| DELETE | `/books/:id` | Delete a book |

Book JSON fields: `title` (string), `author` (string), `price` (non-negative number), `category` (string). IDs are assigned by the app. Data is kept in a JavaScript array and resets when the process restarts, as required by the exam.

Sample POST body:

```json
{
  "title": "Clean Code",
  "author": "Robert C. Martin",
  "price": 35.5,
  "category": "Programming"
}
```

Set `HTTP_PORT` or `API_PORT` to override the respective default port. The two apps can also be started separately with `npm run start:http` and `npm run start:api`.

## Submission checklist

- Complete project files: present in this folder.
- Screenshots of both servers and CRUD calls: save in `screenshots/` after capturing locally.
- GitHub repository: initialize this folder as `MT1-LABEXAM` and push it to the student's own GitHub account.

The source exam prohibits copying another student's implementation; this solution is written for this request. Run both apps and capture real screenshots in this folder before final submission.
