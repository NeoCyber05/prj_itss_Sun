import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'upload-avatar-middleware',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/api/upload-avatar' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => {
              body += chunk;
            });
            req.on('end', () => {
              try {
                const { userId, avatarDataUrl } = JSON.parse(body);
                if (!userId || !avatarDataUrl) {
                  res.statusCode = 400;
                  res.end(JSON.stringify({ error: 'Missing userId or avatarDataUrl' }));
                  return;
                }

                // Tách chuỗi Base64
                const matches = avatarDataUrl.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
                if (!matches || matches.length !== 3) {
                  res.statusCode = 400;
                  res.end(JSON.stringify({ error: 'Invalid base64 image data' }));
                  return;
                }

                const imageBuffer = Buffer.from(matches[2], 'base64');
                const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
                const filename = `avatar-${userId}.${ext}`;
                const dirPath = path.resolve(__dirname, 'public/avatars');
                
                // Tạo thư mục nếu chưa tồn tại
                if (!fs.existsSync(dirPath)) {
                  fs.mkdirSync(dirPath, { recursive: true });
                }

                const filePath = path.join(dirPath, filename);
                fs.writeFileSync(filePath, imageBuffer);

                // Trả về đường dẫn tĩnh của avatar trong repo
                const publicUrl = `/avatars/${filename}`;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, avatarUrl: publicUrl }));
              } catch (err) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: err.message }));
              }
            });
          } else {
            next();
          }
        });
      }
    }
  ],
})
