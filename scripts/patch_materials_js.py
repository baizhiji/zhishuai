#!/usr/bin/env python3
"""Inject upload route into compiled materials.js"""
import shutil

src = '/var/www/zhishuai/server/dist/src/routes/materials.js'
shutil.copy(src, src + '.bak')

with open(src, 'r') as f:
    content = f.read()

upload_route = """
// === 文件上传路由 (APK/Desktop 通用) ===
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const userId = String(req.userId);
    const file = req.file;
    if (!file) return res.status(400).json({ success: false, error: '未提供文件' });
    const baseUrl = process.env.API_BASE_URL || '';
    const fileUrl = baseUrl + '/uploads/materials/' + file.filename;
    await prisma.material.create({
      data: { id: 'mat_' + Date.now() + '_' + Math.random().toString(36).slice(2,8), userId, title: file.originalname, type: file.mimetype.startsWith('image/') ? 'image' : file.mimetype.startsWith('video/') ? 'video' : 'document', content: fileUrl, status: 'unused' }
    });
    res.json({ success: true, data: { url: fileUrl } });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

"""

content = content.replace("exports.default = router;", upload_route + "\nexports.default = router;")

with open(src, 'w') as f:
    f.write(content)

print('Patched successfully')
