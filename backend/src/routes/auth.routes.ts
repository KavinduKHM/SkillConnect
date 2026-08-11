import express from 'express';
import { register, login, getMe } from '../controllers/auth.controller.js';
import { registerValidator, loginValidator } from '../validators/auth.validator.js';
import { validate } from '../middleware/validation.middleware.js';
import { isAuthenticated } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/register', registerValidator, validate, register);
router.post('/login', loginValidator, validate, login);
router.get('/me', isAuthenticated, getMe);

export default router;