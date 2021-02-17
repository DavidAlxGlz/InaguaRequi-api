import {Router} from 'express';

const router = Router();

import { signIn } from "../controllers/user.controller";

router.post('/signin',signIn);

export default router;