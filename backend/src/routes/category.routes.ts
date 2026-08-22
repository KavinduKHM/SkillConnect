import { Router } from 'express';
import prisma from '../config/database.js';

const router = Router();

// Public: Get all categories
router.get('/', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        description: true,
      },
      orderBy: { name: 'asc' },
    });
    res.json(categories);
  } catch (error) {
    console.error('Error loading categories:', error);
    res.status(500).json({ error: 'Failed to load categories' });
  }
});

export default router;