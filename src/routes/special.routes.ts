import {Router} from 'express';

const router = Router();

import {  signUp } from "../controllers/user.controller";
import { createRequi,infoUsuario,showRequis,showRequiById, showMovimientosById } from "../controllers/requis/requi.controller";
import { infoUnidades } from "../controllers/requis/infoUnidades.controller";
import { authJwt } from "../middlewares";

router.post('/signup', authJwt.verifyToken,authJwt.isModerator,signUp);
router.post('/createRequi',authJwt.verifyToken,authJwt.isModerator,createRequi)
router.post('/showRequiById',showRequiById)
router.post('/showMovimientosById',showMovimientosById)
router.get('/infoUsuario',infoUsuario)
router.get('/infoUnidades',infoUnidades)
router.get('/showRequis',showRequis)

export default router;

