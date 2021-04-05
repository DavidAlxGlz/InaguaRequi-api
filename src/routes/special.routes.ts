import {Router} from 'express';

const router = Router();

import {  signUp,getRolByToken } from "../controllers/user.controller";
import { createRequi,infoUsuario,rechazarEnAdquisiciones,rechazarEnPresupuesto,showRequisPresupuesto,aprobarEnPresupuesto,showRequiByIdPresupuesto,showRequiByIdPresupuestoAprobaciones,showRequiByIdDetailsPresupuesto,showRequisUsuarioRechazadas, showMovimientosById, showRequisByUser, showRequisByDepartamentoUsuario,findUserRequiById,usuariosByDpto,getFecha,recibirhojaPresupuesto, showRequisPresupuestoAprobacion, showRequisAdquisiciones, recibirhojaAdquisiciones, showRequisAdquisicionesAprobacion, aprobarEnAdquisiciones, showRequiByIdAdquisiciones, showRequiByIdAdquisicionesAprobaciones } from "../controllers/requis/requi.controller";
import { authJwt } from "../middlewares";
import { getDirectores } from "../controllers/data/extraData";
import { createVale,infoProveedor, infoProveedorById, showMovimientosValeById, getMovimientosVale, showValeById } from "../controllers/vales/vales.controller";

router.post('/signup', authJwt.verifyToken,signUp);
router.post('/createRequi',authJwt.verifyToken,authJwt.isUsuario,createRequi)
router.post('/showMovimientosById',authJwt.verifyToken,authJwt.isUsuario,showMovimientosById)
router.post('/getRolByToken',authJwt.verifyToken,getRolByToken)
router.get('/infoUsuario',authJwt.verifyToken,infoUsuario)
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

//Nuevo modelo requis
router.post('/getUsuariosByDpto',authJwt.verifyToken,authJwt.isUsuario,usuariosByDpto)
router.get('/getFecha',authJwt.verifyToken,authJwt.isUsuario,getFecha)
//usuario presupuesto
router.get('/showRequisPresupuesto',authJwt.verifyToken,showRequisPresupuesto)
router.get('/showRequisPresupuestoAprobacion',authJwt.verifyToken,showRequisPresupuestoAprobacion)
router.post('/recibirHojaPresupuesto',authJwt.verifyToken,recibirhojaPresupuesto)
router.post('/showRequiByIdPresupuesto',authJwt.verifyToken,authJwt.isUsuario,showRequiByIdPresupuesto)
router.post('/showRequiByIdPresupuestoAprobaciones',authJwt.verifyToken,authJwt.isUsuario,showRequiByIdPresupuestoAprobaciones)
router.post('/showRequiByIdDetailsPresupuesto',authJwt.verifyToken,authJwt.isUsuario,showRequiByIdDetailsPresupuesto)
router.post('/aprobarEnPresupuesto',authJwt.verifyToken,aprobarEnPresupuesto)
router.post('/rechazarEnPresupuesto',authJwt.verifyToken,rechazarEnPresupuesto)
//usuario Adquisiciones
router.get('/showRequisAdquisiciones',authJwt.verifyToken,showRequisAdquisiciones)
router.post('/recibirHojaAdquisiciones',authJwt.verifyToken,recibirhojaAdquisiciones)
router.get('/showRequisAdquisicionesAprobacion',authJwt.verifyToken,showRequisAdquisicionesAprobacion)
router.post('/aprobarEnAdquisiciones',authJwt.verifyToken,aprobarEnAdquisiciones)
router.post('/showRequiByIdAdquisiciones',authJwt.verifyToken,authJwt.isUsuario,showRequiByIdAdquisiciones)
router.post('/showRequiByIdAdquisicionesAprobaciones',authJwt.verifyToken,authJwt.isUsuario,showRequiByIdAdquisicionesAprobaciones)
router.post('/rechazarEnAdquisiciones',authJwt.verifyToken,rechazarEnAdquisiciones)
//rechazadas
router.get('/requisRechazadas',authJwt.verifyToken,showRequisUsuarioRechazadas)



export default router;

