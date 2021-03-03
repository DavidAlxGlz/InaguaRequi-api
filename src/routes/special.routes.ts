import {Router} from 'express';

const router = Router();

import {  signUp,getRolByToken } from "../controllers/user.controller";
import { createRequi,infoUsuario,showRequis,showRequiById, showMovimientosById, showRequisByUser, showRequisByDepartamentoUsuario } from "../controllers/requis/requi.controller";
import { authJwt } from "../middlewares";
import { getDirectores } from "../controllers/data/extraData";
import { createVale } from "../controllers/vales/vales.controller";

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
router.get('/getDirectores',getDirectores)
router.post('/createVale',createVale)

export default router;

