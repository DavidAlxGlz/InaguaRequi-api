import {Router} from 'express';

const router = Router();

import {  signUp,getRolByToken } from "../controllers/user.controller";
import { createRequi,infoUsuario,showRequis,showRequiById, showMovimientosById, showRequisByUser, showRequisByDepartamentoUsuario,findUserRequiById } from "../controllers/requis/requi.controller";
import { authJwt } from "../middlewares";
import { getDirectores } from "../controllers/data/extraData";
import { createVale,infoProveedor, infoProveedorById, showMovimientosValeById, getMovimientosVale, showValeById } from "../controllers/vales/vales.controller";

router.post('/signup', authJwt.verifyToken,signUp);
router.post('/createRequi',authJwt.verifyToken,authJwt.isUsuario,createRequi)
router.post('/showRequiById',authJwt.verifyToken,authJwt.isUsuario,showRequiById)
router.post('/showMovimientosById',authJwt.verifyToken,authJwt.isUsuario,showMovimientosById)
router.post('/getRolByToken',authJwt.verifyToken,getRolByToken)
router.get('/infoUsuario',authJwt.verifyToken,infoUsuario)
//router.get('/infoUnidades',infoUnidades)
router.get('/showRequis',authJwt.verifyToken,authJwt.isAdministrativo,showRequis)
router.get('/showRequisByUser',authJwt.verifyToken,authJwt.isUsuario,showRequisByUser)
router.get('/showRequisByDepartamentoUsuario',authJwt.verifyToken,authJwt.isJefeDpto,showRequisByDepartamentoUsuario)
router.get('/getDirectores',authJwt.verifyToken,authJwt.isUsuario,getDirectores)
router.post('/createVale',authJwt.verifyToken,authJwt.isAdministrativo,createVale)
router.get('/infoProveedor',authJwt.verifyToken,authJwt.isAdministrativo,infoProveedor)
router.post('/infoProveedorById',authJwt.verifyToken,authJwt.isAdministrativo,infoProveedorById)
router.post('/showMovimientosValeById',authJwt.verifyToken,authJwt.isAdministrativo,showMovimientosValeById)
router.post('/getMovimientosVale',authJwt.verifyToken,authJwt.isAdministrativo,getMovimientosVale)
router.post('/showValebyId',authJwt.verifyToken,authJwt.isAdministrativo,showValeById)
router.post('/findUserRequiById',authJwt.verifyToken,authJwt.isUsuario,findUserRequiById)

export default router;

