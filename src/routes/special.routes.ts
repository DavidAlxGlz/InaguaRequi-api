import {Router} from 'express';

const router = Router();

import {  signUp } from "../controllers/user.controller";
import { createRequi,infoUsuario } from "../controllers/requis/requi.controller";
import { authJwt } from "../middlewares";

router.post('/signup', authJwt.verifyToken,authJwt.isModerator,signUp);
router.post('/createRequi',authJwt.verifyToken,authJwt.isModerator,createRequi)
router.get('/infoUsuario',infoUsuario)

export default router;

