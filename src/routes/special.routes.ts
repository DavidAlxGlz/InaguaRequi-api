import {Router} from 'express';

const router = Router();

import {  signUp } from "../controllers/user.controller";
import { createRequi } from "../controllers/requis/requi.controller";
import { authJwt } from "../middlewares";

router.post('/signup', authJwt.verifyToken,authJwt.isModerator,signUp);
router.post('/createRequi',createRequi)

export default router;

