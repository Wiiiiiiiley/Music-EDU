import { Router } from 'express';
import { prisma } from '../index';

const router = Router();

// 获取所有乐谱
router.get('/', async (req, res) => {
  try {
    const { ensembleId } = req.query;
    const scores = await prisma.score.findMany({
      where: ensembleId ? { ensembleId: ensembleId as string } : undefined,
      include: {
        ensemble: true,
        _count: {
          select: { marks: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(scores);
  } catch (error) {
    console.error('获取乐谱列表失败:', error);
    res.status(500).json({ error: '获取乐谱列表失败' });
  }
});

// 获取单个乐谱详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const score = await prisma.score.findUnique({
      where: { id },
      include: {
        marks: {
          include: {
            creator: {
              select: { name: true, role: true }
            }
          }
        },
        measures: {
          include: {
            cues: true
          },
          orderBy: { number: 'asc' }
        },
        ensemble: true
      }
    });
    
    if (!score) {
      return res.status(404).json({ error: '乐谱不存在' });
    }
    
    res.json(score);
  } catch (error) {
    console.error('获取乐谱详情失败:', error);
    res.status(500).json({ error: '获取乐谱详情失败' });
  }
});

// 创建乐谱
router.post('/', async (req, res) => {
  try {
    const { title, composer, fileUrl, fileType, audioUrl, ensembleId } = req.body;
    
    const score = await prisma.score.create({
      data: {
        title,
        composer,
        fileUrl,
        fileType,
        audioUrl,
        ensembleId
      }
    });
    
    // 自动创建小节（假设有100个小节）
    const measures = await Promise.all(
      Array.from({ length: 100 }, (_, i) =>
        prisma.measure.create({
          data: {
            number: i + 1,
            scoreId: score.id
          }
        })
      )
    );
    
    res.status(201).json({ ...score, measures });
  } catch (error) {
    console.error('创建乐谱失败:', error);
    res.status(500).json({ error: '创建乐谱失败' });
  }
});

// 更新乐谱
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, composer, audioUrl } = req.body;
    
    const score = await prisma.score.update({
      where: { id },
      data: {
        title,
        composer,
        audioUrl
      }
    });
    
    res.json(score);
  } catch (error) {
    console.error('更新乐谱失败:', error);
    res.status(500).json({ error: '更新乐谱失败' });
  }
});

// 删除乐谱
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.score.delete({
      where: { id }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('删除乐谱失败:', error);
    res.status(500).json({ error: '删除乐谱失败' });
  }
});

// 获取乐谱的所有标记
router.get('/:id/marks', async (req, res) => {
  try {
    const { id } = req.params;
    const { section } = req.query;
    
    const marks = await prisma.mark.findMany({
      where: {
        scoreId: id,
        OR: [
          { targetSection: section as string || null },
          { targetSection: null }
        ]
      },
      include: {
        creator: {
          select: { name: true, role: true, section: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(marks);
  } catch (error) {
    console.error('获取标记失败:', error);
    res.status(500).json({ error: '获取标记失败' });
  }
});

// 添加小节提示
router.post('/:id/measures/:measureId/cues', async (req, res) => {
  try {
    const { measureId } = req.params;
    const { type, targetSection, audioUrl, bpm, timeSignature } = req.body;
    
    const cue = await prisma.cue.create({
      data: {
        type,
        measureId,
        targetSection,
        audioUrl,
        bpm,
        timeSignature
      }
    });
    
    res.status(201).json(cue);
  } catch (error) {
    console.error('添加提示失败:', error);
    res.status(500).json({ error: '添加提示失败' });
  }
});

// 更新小节时间戳（用于音频对齐）
router.put('/:id/measures/:measureId/timing', async (req, res) => {
  try {
    const { measureId } = req.params;
    const { startTime, endTime } = req.body;
    
    const measure = await prisma.measure.update({
      where: { id: measureId },
      data: { startTime, endTime }
    });
    
    res.json(measure);
  } catch (error) {
    console.error('更新时间戳失败:', error);
    res.status(500).json({ error: '更新时间戳失败' });
  }
});

export default router;
