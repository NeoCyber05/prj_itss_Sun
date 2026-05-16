# RakuSlide

Frontend React + Vite cho ứng dụng quản lý slide template.

## Công nghệ chính

- React 19
- Vite 8
- Supabase JS

## Yêu cầu

- Node.js 18 trở lên
- npm 9 trở lên

## Biến môi trường

Tạo file `.env` ở root project:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_or_publishable_key
VITE_GOOGLE_CSE_API_KEY=your_google_custom_search_api_key
VITE_GOOGLE_CSE_ID=your_google_programmable_search_engine_id
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_GEMINI_MODEL=gemini-2.5-flash
```

`VITE_GOOGLE_CSE_API_KEY` và `VITE_GOOGLE_CSE_ID` dùng cho chức năng tìm ảnh bằng Google Custom Search API.
`VITE_GEMINI_API_KEY` dùng cho chức năng AI text tạo dàn ý và nội dung slide bằng Gemini API.

## Chạy project

### 1. Cài đặt dependency

```bash
npm install
```

### 2. Chạy dev server

```bash
npm run dev
```

Vite sẽ in ra URL local, thường là:

```text
http://localhost:5173
```

### 3. Mở ứng dụng

Truy cập URL Vite trong trình duyệt.

## Lệnh hữu ích

Chạy lint:

```bash
npm run lint
```

Build production:

```bash
npm run build
```

Preview bản build:

```bash
npm run preview
```
