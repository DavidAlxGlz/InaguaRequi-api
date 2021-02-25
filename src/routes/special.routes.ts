import {Router} from 'express';

const router = Router();

import {  signUp,getRolByToken } from "../controllers/user.controller";
import { createRequi,infoUsuario,showRequis,showRequiById, showMovimientosById, showRequisByUser, showRequisByDepartamentoUsuario } from "../controllers/requis/requi.controller";
import { authJwt } from "../middlewares";

router.post('/signup', authJwt.verifyToken,authJwt.isModerator,signUp);
router.post('/createRequi',authJwt.verifyToken,authJwt.isModerator,createRequi)
router.post('/showRequiById',showRequiById)
router.post('/showMovimientosById',showMovimientosById)
router.post('/getRolByToken',getRolByToken)
router.get('/infoUsuario',infoUsuario)
//router.get('/infoUnidades',infoUnidades)
router.get('/showRequis',showRequis)
router.get('/showRequisByUser',showRequisByUser)
router.get('/showRequisByDepartamentoUsuario',showRequisByDepartamentoUsuario)

export default router;

