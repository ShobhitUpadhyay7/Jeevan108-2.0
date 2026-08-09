import { Router } from 'express';
import { signup, login, refreshToken, logout, logoutAll } from '../controllers/auth.controller.js';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.post('/logout-all', logoutAll);

export default router;