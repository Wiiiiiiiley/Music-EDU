import { Router } from 'express';
import { prisma } from '../index';

const router = Router();

// 获取所有乐团
router.get('/', async (req, res) => {
  try {
    const ensembles = await prisma.ensemble.findMany({
      include: {
        _count: {
          select: { members: true, scores: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(ensembles);
  } catch (error) {
    console.error('获取乐团列表失败:', error);
    res.status(500).json({ error: '获取乐团列表失败' });
  }
});

// 获取乐团详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const ensemble = await prisma.ensemble.findUnique({
      where: { id },
      include: {
        members: {
          orderBy: [
            { role: 'asc' },
            { section: 'asc' }
          ]
        },
        scores: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    
    if (!ensemble) {
      return res.status(404).json({ error: '乐团不存在' });
    }
    
    res.json(ensemble);
  } catch (error) {
    console.error('获取乐团详情失败:', error);
    res.status(500).json({ error: '获取乐团详情失败' });
  }
});

// 创建乐团
router.post('/', async (req, res) => {
  try {
    const { name, conductorId } = req.body;
    
    const ensemble = await prisma.ensemble.create({
      data: {
        name,
        conductorId
      }
    });
    
    res.status(201).json(ensemble);
  } catch (error) {
    console.error('创建乐团失败:', error);
    res.status(500).json({ error: '创建乐团失败' });
  }
});

// 添加成员
router.post('/:id/members', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, instrument, section } = req.body;
    
    const member = await prisma.member.create({
      data: {
        name,
        role,
        instrument,
        section,
        ensembleId: id
      }
    });
    
    res.status(201).json(member);
  } catch (error) {
    console.error('添加成员失败:', error);
    res.status(500).json({ error: '添加成员失败' });
  }
});

// 更新成员
router.put('/:id/members/:memberId', async (req, res) => {
  try {
    const { memberId } = req.params;
    const { name, instrument, section } = req.body;
    
    const member = await prisma.member.update({
      where: { id: memberId },
      data: { name, instrument, section }
    });
    
    res.json(member);
  } catch (error) {
    console.error('更新成员失败:', error);
    res.status(500).json({ error: '更新成员失败' });
  }
});

// 删除成员
router.delete('/:id/members/:memberId', async (req, res) => {
  try {
    const { memberId } = req.params;
    await prisma.member.delete({
      where: { id: memberId }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('删除成员失败:', error);
    res.status(500).json({ error: '删除成员失败' });
  }
});

// 获取乐团的声部列表
router.get('/:id/sections', async (req, res) => {
  try {
    const { id } = req.params;
    
    const sections = await prisma.member.groupBy({
      by: ['section'],
      where: {
        ensembleId: id,
        section: { not: null }
      },
      _count: {
        section: true
      }
    });
    
    res.json(sections.map((s: any) => ({
      name: s.section,
      memberCount: s._count.section
    })));
  } catch (error) {
    console.error('获取声部列表失败:', error);
    res.status(500).json({ error: '获取声部列表失败' });
  }
});

export default router;
