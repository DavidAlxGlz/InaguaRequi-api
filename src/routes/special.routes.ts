import {Router} from 'express';

const router = Router();

import {  signUp,getRolByToken } from "../controllers/user.controller";
import { createRequi,finalizarEntrega,findUserRequiByIdAprobadas,showRequisUsuarioAprobadas,infoUsuario,showLastRechazoByIdRequi,rechazarEnAdquisiciones,rechazarEnPresupuesto,showRequisPresupuesto,showRequiByIdHistorial,showRequiByIdDetailsUsuario,aprobarEnPresupuesto,showRequiByIdPresupuesto,showRequiByIdPresupuestoAprobaciones,showRequiByIdDetailsPresupuesto,showRequisUsuarioRechazadas, showMovimientosById, showRequisByUser, showRequisByDepartamentoUsuario,findUserRequiById,solicitantesByUser,getFecha,recibirhojaPresupuesto, showRequisPresupuestoAprobacion, showRequisAdquisiciones, recibirhojaAdquisiciones, showRequisAdquisicionesAprobacion, aprobarEnAdquisiciones, showRequiByIdAdquisiciones, showRequiByIdAdquisicionesAprobaciones, showMovimientosByIdEdit, editRequi, showHistorialById, showAllRequis, showRequisDirector, showRequiDirectorById, getDetailsToEdit, recibirhojaCajaChica, showRequisCajaChicaAprobacion, showRequiByIdCajaChicaAprobaciones, rechazarEnCajaChica, aprobarEnCajaChica, historialByUsuario, vehiculos, plantas } from "../controllers/requis/requi.controller";
import { authJwt } from "../middlewares";
import { getDirectores, getRoles, getDepartamentos, getUsuarios, addSolicitante } from "../controllers/data/extraData";
import { createVale,infoProveedor, infoProveedorById, showMovimientosValeById, getMovimientosVale, showValeById, getProveedoresValeByNombre } from "../controllers/vales/vales.controller";
import { getMovimientosEstudio,getProveedoresEstudio } from '../controllers/estudio/estudio.controller';
import { programarLicitacion } from '../controllers/licitacion/licitacion';
import { getProveedores, insertProveedor } from '../controllers/proveedores/proveedores';
import { createPedido, misPedidos, pedidoDetalles, requisicionPedido, showMovimientosByIdPedido } from '../controllers/pedido/pedido';
import { infoMainDashboard } from '../controllers/charts/main.controller';
import { requiToEdit, solicitantes } from '../controllers/requis/editRequi.controller';

router.post('/signup',signUp);
router.post('/createRequi',authJwt.verifyToken,authJwt.isUsuario,createRequi)
router.post('/showMovimientosById',authJwt.verifyToken,authJwt.isUsuario,showMovimientosById)
router.post('/getRolByToken',authJwt.verifyToken,getRolByToken)
router.get('/infoUsuario',authJwt.verifyToken,infoUsuario)
router.get('/showRequisByDepartamentoUsuario',authJwt.verifyToken,authJwt.isJefeDpto,showRequisByDepartamentoUsuario)
router.get('/getDirectores',authJwt.verifyToken,authJwt.isUsuario,getDirectores)


//user
router.post('/findUserRequiById',authJwt.verifyToken,authJwt.isUsuario,findUserRequiById)
router.get('/showRequisByUser',authJwt.verifyToken,authJwt.isUsuario,showRequisByUser)
router.get('/showRequisByUserAprobadas',authJwt.verifyToken,showRequisUsuarioAprobadas)
router.post('/findUserRequiByIdAprobadas',authJwt.verifyToken,authJwt.isUsuario,findUserRequiByIdAprobadas)
router.post('/finalizarEntrega',authJwt.verifyToken,finalizarEntrega)
router.post('/showRequiByIdDetailsUsuario',authJwt.verifyToken,authJwt.isUsuario,showRequiByIdDetailsUsuario)
router.post('/getDetailsToEdit',authJwt.verifyToken,authJwt.isUsuario,getDetailsToEdit)
router.get('/vehiculos',authJwt.verifyToken,authJwt.isUsuario,vehiculos)
router.get('/plantas',authJwt.verifyToken,authJwt.isUsuario,plantas)



//Nuevo modelo requis
router.post('/solicitantesByUser',authJwt.verifyToken,authJwt.isUsuario,solicitantesByUser)
router.get('/getFecha',authJwt.verifyToken,authJwt.isUsuario,getFecha)

//usuario presupuesto
router.get('/showRequisPresupuesto',authJwt.verifyToken,authJwt.isPresupuesto,showRequisPresupuesto)
router.get('/showRequisPresupuestoAprobacion',authJwt.verifyToken,authJwt.isPresupuesto,showRequisPresupuestoAprobacion)
router.post('/recibirHojaPresupuesto',authJwt.verifyToken,authJwt.isPresupuesto,recibirhojaPresupuesto)
router.post('/showRequiByIdPresupuesto',authJwt.verifyToken,authJwt.isPresupuesto,showRequiByIdPresupuesto)
router.post('/showRequiByIdPresupuestoAprobaciones',authJwt.verifyToken,authJwt.isPresupuesto,showRequiByIdPresupuestoAprobaciones)

//usuario normal usa showRequiByIdDetailspresupuesto como detalles 
router.post('/showRequiByIdDetailsPresupuesto',authJwt.verifyToken,authJwt.isUsuario,showRequiByIdDetailsPresupuesto)
router.post('/aprobarEnPresupuesto',authJwt.verifyToken,authJwt.isPresupuesto,aprobarEnPresupuesto)
router.post('/rechazarEnPresupuesto',authJwt.verifyToken,authJwt.isPresupuesto,rechazarEnPresupuesto)


//usuario Adquisiciones
router.get('/showRequisAdquisiciones',authJwt.verifyToken,showRequisAdquisiciones)
router.post('/recibirHojaAdquisiciones',authJwt.verifyToken,recibirhojaAdquisiciones)
router.get('/showRequisAdquisicionesAprobacion',authJwt.verifyToken,showRequisAdquisicionesAprobacion)
router.post('/aprobarEnAdquisiciones',authJwt.verifyToken,aprobarEnAdquisiciones)
router.post('/showRequiByIdAdquisiciones',authJwt.verifyToken,authJwt.isAdquisiciones,showRequiByIdAdquisiciones)
router.post('/showRequiByIdAdquisicionesAprobaciones',authJwt.verifyToken,authJwt.isAdquisiciones,showRequiByIdAdquisicionesAprobaciones)
router.post('/rechazarEnAdquisiciones',authJwt.verifyToken,authJwt.isAdquisiciones,rechazarEnAdquisiciones)

router.post('/createVale',authJwt.verifyToken,authJwt.isAdquisiciones,createVale)
router.get('/infoProveedor',authJwt.verifyToken,authJwt.isAdquisiciones,infoProveedor)
router.post('/infoProveedorById',authJwt.verifyToken,authJwt.isAdquisiciones,infoProveedorById)
router.post('/showMovimientosValeById',authJwt.verifyToken,authJwt.isAdquisiciones,showMovimientosValeById)
router.post('/getMovimientosVale',authJwt.verifyToken,authJwt.isAdquisiciones,getMovimientosVale)
router.post('/showValebyId',authJwt.verifyToken,authJwt.isAdquisiciones,showValeById)

//Caja chica
router.post('/recibirHojaCajaChica',authJwt.verifyToken,recibirhojaCajaChica)
router.get('/showRequisCajaChicaAprobacion',authJwt.verifyToken,showRequisCajaChicaAprobacion)
router.post('/showRequiByIdCajaChicaAprobaciones',authJwt.verifyToken,showRequiByIdCajaChicaAprobaciones)
router.post('/rechazarEnCajaChica',authJwt.verifyToken,rechazarEnCajaChica)
router.post('/aprobarEnCajaChica',authJwt.verifyToken,aprobarEnCajaChica)

//Proveedores
router.get('/getProveedores',authJwt.verifyToken,authJwt.isAdquisiciones,getProveedores)
router.post('/insertProveedores',authJwt.verifyToken,authJwt.isAdquisiciones,insertProveedor)

//rechazadas
router.get('/requisRechazadas',authJwt.verifyToken,authJwt.isUsuario,showRequisUsuarioRechazadas)
router.post('/showMovimientosByIdEdit',authJwt.verifyToken,authJwt.isUsuario,showMovimientosByIdEdit)
router.post('/editRequi',authJwt.verifyToken,authJwt.isUsuario,editRequi)
router.post('/ultimoRechazo',authJwt.verifyToken,authJwt.isUsuario,showLastRechazoByIdRequi)

//Directores
router.get('/showDireccionRequis',authJwt.isDirector,showRequisDirector)
router.post('/showDireccionRequiById',authJwt.isDirector,showRequiDirectorById)


//Directores plus
router.post('/showHistorialById',authJwt.verifyToken,showHistorialById)
router.get('/showAllRequis',authJwt.verifyToken,showAllRequis)
router.post('/showRequiByIdHistorial',authJwt.verifyToken,showRequiByIdHistorial)


//Estudio de mercado
router.post('/getMovimientosEstudio',authJwt.verifyToken,authJwt.isUsuario,getMovimientosEstudio)
router.post('/getProveedoresEstudio',authJwt.verifyToken,authJwt.isUsuario,getProveedoresEstudio)

//Administrador
router.get('/getRoles',authJwt.verifyToken,authJwt.isAdmin,getRoles)
router.get('/getDepartamentos',authJwt.verifyToken,authJwt.isAdmin,getDepartamentos)
router.get('/getUsuarios',authJwt.verifyToken,authJwt.isAdmin,getUsuarios)
router.post('/addSolicitante',authJwt.verifyToken,authJwt.isAdmin,addSolicitante)

//Licitaciones
router.post('/programarLicitacion',authJwt.verifyToken,programarLicitacion)

//Vales
router.post('getProveedoresValesByNombre',authJwt.verifyToken,authJwt.isAdquisiciones,getProveedoresValeByNombre)

//sin verificar rol ya que cualquier area puede verlo
router.post('/historialByUsuario',authJwt.verifyToken,historialByUsuario)

//pedidos
router.post('/requisicionPedido',authJwt.verifyToken,requisicionPedido)
router.post('/showMovimientosByIdPedido',authJwt.verifyToken,authJwt.isUsuario,showMovimientosByIdPedido)
router.post('/createPedido',authJwt.verifyToken,createPedido)
router.get('/misPedidos',authJwt.verifyToken,misPedidos)
router.post('/pedidoDetalles',authJwt.verifyToken,pedidoDetalles)

//newRequiEdit
router.get('/solicitantes',authJwt.verifyToken,solicitantes)
router.post('/requiToEdit',authJwt.verifyToken,requiToEdit)

//chart
router.get('/infoMainDashboard',infoMainDashboard)


export default router;

