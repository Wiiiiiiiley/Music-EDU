import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// 配置存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = file.fieldname === 'audio' ? 'audio' : 'scores';
    cb(null, `uploads/${type}/`);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// 文件过滤
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes: Record<string, string[]> = {
    score: ['application/pdf', 'application/vnd.recordare.musicxml', 'application/xml', 'text/xml'],
    audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3', 'audio/webm']
  };
  
  const fieldname = file.fieldname as 'score' | 'audio';
  const allowed = allowedMimeTypes[fieldname] || [];
  
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`不支持的文件类型: ${file.mimetype}`));
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});

// 上传乐谱文件
router.post('/score', upload.single('score'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '没有上传文件' });
    }
    
    const fileUrl = `/uploads/scores/${req.file.filename}`;
    const fileType = req.file.mimetype === 'application/pdf' ? 'pdf' : 'musicxml';
    
    res.json({
      success: true,
      fileUrl,
      fileType,
      originalName: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    console.error('上传乐谱失败:', error);
    res.status(500).json({ error: '上传乐谱失败' });
  }
});

// 上传音频文件
router.post('/audio', upload.single('audio'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '没有上传文件' });
    }
    
    const fileUrl = `/uploads/audio/${req.file.filename}`;
    
    res.json({
      success: true,
      fileUrl,
      originalName: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    console.error('上传音频失败:', error);
    res.status(500).json({ error: '上传音频失败' });
  }
});

// 多文件上传（乐谱 + 音频）
router.post('/both', upload.fields([
  { name: 'score', maxCount: 1 },
  { name: 'audio', maxCount: 1 }
]), (req, res) => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    const result: any = {};
    
    if (files.score?.[0]) {
      result.score = {
        fileUrl: `/uploads/scores/${files.score[0].filename}`,
        fileType: files.score[0].mimetype === 'application/pdf' ? 'pdf' : 'musicxml',
        originalName: files.score[0].originalname
      };
    }
    
    if (files.audio?.[0]) {
      result.audio = {
        fileUrl: `/uploads/audio/${files.audio[0].filename}`,
        originalName: files.audio[0].originalname
      };
    }
    
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('上传失败:', error);
    res.status(500).json({ error: '上传失败' });
  }
});

export default router;
