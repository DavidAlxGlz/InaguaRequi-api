import { connect } from '../../database';
import {Request,Response} from 'express';
import jwt from "jsonwebtoken";
import config from '../../config';
import Pool from 'mysql2/typings/mysql/lib/Pool';


// Funcion para crear una requisición y crear registro en historial
export const createRequi=async(req:Request,res:Response):Promise<Response>=>{
  if(!req.body || !req.header){
    return res.status(400).json({ msg: 'Envia toda la informacion' })
  }

  let conn:any =null;
  const pool = await connect();

  try {
    const toke = req.headers["x-access-token"]?.toString();

    if(!toke) return res.status(403).json({ message: "sin token" })

    const decoded:any = jwt.verify(toke,config.SECRET);

    if(!decoded) return res.status(404).json({ message:' token invalido ' })

    const arr = req.body;
    const movimientos = arr.movimientos;

    conn = await pool.getConnection();
      //La requisicion requiere el ID del centro de costo. por default en el front-end esta enviando en 1
      const CC:any = await conn.query('SELECT idCentroCosto from centrocosto where centroCosto = ?',[arr.CentroCosto_idCentroCosto]);
      const idCC = CC[0][0].idCentroCosto;
      await conn.beginTransaction();
      const requi:any = await conn.query(`INSERT INTO requisiciones(idRequisiciones,fecha,justificacion,Usuarios_idUsuarios,CentroCosto_idCentroCosto,Directores_idDirectores,bienesOServicios,Usuarios_requiriente,estado,gastoCorriente,recursoPropio,recursoOtros,descOtros,vehiculo,planta) values(default,default,?,?,?,?,?,?,?,?,?,?,?,?,?)`,[arr.justificacion,decoded.id,idCC,arr.Directores_idDirectores,arr.bienesOServicios,arr.Usuarios_requiriente,arr.estado,arr.gastoCorriente,arr.recursoPropio,arr.recursoOtros,arr.descOtros,arr.placas,arr.plantas]);

      //cambiar por select para obtener el id de la requi creada
      const idNuevaRequi = requi[0].insertId;
      movimientos.map(async(requi:any,index:number)=>{
        const movi = await conn.query('INSERT INTO movimiento (idMovimiento,descripcion,cantidad,Unidades_idUnidades,Requisiciones_idRequisiciones,cUnitarioAprox) values(default,?,?,?,?,?)',[requi.descripcion,requi.cantidad,requi.unidades,idNuevaRequi,requi.cUnitarioAprox]);
      })

      //Añadir al historial el movimiento realizado
      const histo = await conn.query('INSERT INTO historial(idhistorial,Usuarios_idUsuarios,Requisiciones_idRequisiciones,comentarios,nuevoEstado) values(default,?,?,?,?)',[decoded.id,idNuevaRequi,'Nueva Requisición',1]);

      //Mensaje en consola
      console.log(`REQUISICION CREADA --> Id Usuario: ${decoded.id} | Requisición: ${idNuevaRequi} | Time: ${new Date()}`)

      await conn.commit();
      pool.end()
      return res.status(200).json(requi)

      } catch (error) {
        if (conn) await conn.rollback();
        pool.end();
        return res.status(400).send(error)
        throw error;
      } 
}

//Editar requisición, solo sera posible editar si el estatus de la requisición se encuentra en 1 o 0 (es decir que no a pasado a presupuesto, o que fue rechazada)
export const editRequi =async(req:Request,res:Response)=>{
  if(!req.body || !req.header){
    return res.status(400).json({ msg: 'Envia toda la informacion' })
  }

  let msg='';
  let conn:any =null;
  const pool = await connect();
  try {
    const toke = req.headers["x-access-token"]?.toString();

    if(!toke) return res.status(403).json({ message: "sin token" })

    const decoded:any = jwt.verify(toke,config.SECRET);

    if(!decoded) return res.status(404).json({ message:' token invalido ' })

    const arr = req.body;
    const movimientos = arr.movimientos;
    conn = await pool.getConnection();
    const getEstado = await conn.query('SELECT estado FROM inagua_requis.requisiciones where idRequisiciones = ?',[arr.idRequi])
    
    if(getEstado[0][0].estado === 0 || getEstado[0][0].estado === 1){
      await conn.beginTransaction();
      const del = await conn.query('Delete from movimiento where Requisiciones_idRequisiciones = ?',[arr.idRequi]);

      movimientos.map(async(requi:any,index:number)=>{
        const movi = await conn.query('INSERT INTO movimiento (idMovimiento,descripcion,cantidad,Unidades_idUnidades,Requisiciones_idRequisiciones,cUnitarioAprox) values(default,?,?,?,?,?)',[requi.descripcion,requi.cantidad,requi.Unidades_idUnidades,arr.idRequi,requi.cUnitarioAprox]);
      })
      const estado = await conn.query('UPDATE requisiciones SET estado = 1 , justificacion = ? , bienesOServicios = ? , Usuarios_requiriente = ? , Directores_idDirectores = ? , gastoCorriente = ? , recursoPropio = ? , recursoOtros = ? , descOtros = ? where idRequisiciones = ?',[arr.justificacion,arr.bienesOServicios,arr.Usuarios_requiriente,arr.Directores_idDirectores,arr.gastoCorriente,arr.recursoPropio,arr.recursoOtros,arr.descOtros,arr.idRequi]);
      const addHistory = await conn.query('INSERT INTO historial(idhistorial,Usuarios_idUsuarios,Requisiciones_idRequisiciones,comentarios,nuevoEstado) values(default,?,?,?,?)',[decoded.id,arr.idRequi,'Requisición editada',1]);
      await conn.commit();
      msg ='success';

      console.log(`REQUISICION EDITADA --> ID USUARIO: ${decoded.id} | ID REQUISICION: ${arr.idRequi} | Time: ${new Date()}`)
    }else{
      msg='No es posible editar esta requisición'
      console.log(`Edicion fallida --> ${decoded.id} | ID REQUISICION: ${arr.idRequi} | Time: ${new Date()}`)
    }
    pool.end()
    return res.status(200).json({msg:msg})
  }catch (error){
    if (conn) await conn.rollback();
    pool.end();
    return res.status(400).send(error)
  }

}

//información para el historial segun el id
export const showHistorialById =async(req:Request,res:Response)=>{
  if(!req.body || !req.header){
    return res.status(400).json({ msg: 'Envia toda la informacion' })
  }
  const arr = req.body;
  let conn:any = null;
  const pool = await connect();
  try {
      const toke = req.headers["x-access-token"]?.toString();  

      if(!toke) return res.status(403).json({ message: "sin token" })

      const decoded:any = jwt.verify(toke,config.SECRET);

      if(!decoded) return res.status(404).json({ message:' token invalido '})

      conn = await pool.getConnection();
      const hist = await conn.query('select idhistorial,Usuarios_idUsuarios,comentarios,nuevoEstado,fecha,idUsuarios,nombre,apellido from historial join usuarios as usuario on usuario.idUsuarios = historial.Usuarios_idUsuarios where Requisiciones_idRequisiciones = ? order by fecha desc',[arr.idRequi]);
      pool.end()
      return res.status(200).json(hist[0])
  } catch (error) {
      pool.end()
      return res.status(401).json({ message: 'no autorizado' }) 
    }
}

//informacion de usuario
export const infoUsuario =async(req:Request,res:Response)=>{
  let conn:any = null;
  const pool = await connect();
  try {
      const toke = req.headers["x-access-token"]?.toString();  
      if(!toke) return res.status(403).json({ message: "sin token" })
      const decoded:any = jwt.verify(toke,config.SECRET);
      if(!decoded) return res.status(404).json({ message:' token invalido '})
      conn = await pool.getConnection();
      const idUsuario = decoded.id;
      const UserSelect:any = await conn.query('SELECT idUsuarios,nombre,apellido,Roles_idRoles,rol,departamentos.idDepartamentos,departamentos.departamento,direcciones.idDirecciones,direcciones.direccion FROM usuarios INNER JOIN roles ON usuarios.Roles_idroles = roles.idroles INNER JOIN departamentos ON departamentos.idDepartamentos = usuarios.Departamentos_idDepartamentos INNER JOIN direcciones ON direcciones.idDirecciones = departamentos.Direcciones_idDirecciones WHERE usuarios.idUsuarios = ?;',[idUsuario])
      if(!UserSelect){
         return res.status(400).json({msg:'el usuario no existe'})
      }
      const {idUsuarios,nombre,apellido,rol,idDepartamentos,departamento,idDirecciones,direccion} = UserSelect[0][0];
      pool.end()
      res.status(200).json({idUsuarios,nombre,apellido,rol,idDepartamentos,departamento,idDirecciones,direccion})
    } catch (error) {
      pool.end()
      return res.status(401).json({ message: 'no autorizado' }) 
    }
}

//informacion de vehiculos
export const vehiculos =async(req:Request,res:Response)=>{
  let conn:any = null;
  const pool = await connect();
  try {
      const toke = req.headers["x-access-token"]?.toString();  
      if(!toke) return res.status(403).json({ message: "sin token" });
      const decoded:any = jwt.verify(toke,config.SECRET);
      if(!decoded) return res.status(404).json({ message:' token invalido '});
      conn = await pool.getConnection();
      const idUsuario = decoded.id;
      const response:any = await conn.query('Select * from vehiculos');
      pool.end();
      res.status(200).json(response[0]);
    } catch (error) {
      pool.end();
      return res.status(401).json({ message: 'no autorizado' });
    }
}

//informacion de vehiculos
export const plantas =async(req:Request,res:Response)=>{
  let conn:any = null;
  const pool = await connect();
  try {
      const toke = req.headers["x-access-token"]?.toString();  
      if(!toke) return res.status(403).json({ message: "sin token" });
      const decoded:any = jwt.verify(toke,config.SECRET);
      if(!decoded) return res.status(404).json({ message:' token invalido '});
      conn = await pool.getConnection();
      const idUsuario = decoded.id;
      const response:any = await conn.query('Select * from plantas');
      pool.end();
      res.status(200).json(response[0]);
    } catch (error) {
      pool.end();
      return res.status(401).json({ message: 'no autorizado' });
    }
}

//Obtener usuarios solicitantes por persona
export const solicitantesByUser =async(req:Request,res:Response)=>{
  if(!req.body || !req.header){
    return res.status(400).json({ msg: 'Envia toda la informacion' })
  }
  let conn:any = null;
  const pool = await connect();
  const Departamentos_idDepartamentos = req.body.idDepartamentos;
  try {
    const toke = req.headers["x-access-token"]?.toString();  
      if(!toke) return res.status(403).json({ message: "sin token" })
      const decoded:any = jwt.verify(toke,config.SECRET);
      if(!decoded) return res.status(404).json({ message:' token invalido '})
    conn = await pool.getConnection();
    const response:any = await conn.query('select * from solicitantes inner join usuarios as usuario on usuario.idUsuarios = solicitantes.Usuarios_idUsuarios where solicitantes.Usuario = ?',[decoded.id])
    if(!response){
      return res.status(400).json({msg:'Sin resultados'})
    }
   pool.end()
   res.status(200).json(response[0])
  } catch (error) {
    pool.end()
    return res.status(401).json({ message: 'no autorizado' }) 
  }
}

//ver todas las requisiciones presupuesto Solicitudes
export const showRequisPresupuesto =async(req:Request,res:Response):Promise<Response>=>{
  const conn = await connect();
    try {
      const requis = await conn.query('SELECT idRequisiciones,fecha,justificacion,requiriente.nombre as NomRequiriente, requiriente.apellido as ApeRequiriente, centrocosto.centroCosto,CCdepartamento.departamento as CCdepartamento, CCdireccion.direccion as CCdireccion,bienesOServicios,requi.estado,DptoUsuario.departamento FROM inagua_requis.requisiciones as requi inner join usuarios as requiriente on requiriente.idUsuarios = requi.Usuarios_requiriente inner join usuarios as usuario on usuario.idUsuarios = requi.Usuarios_idUsuarios inner join centrocosto on centrocosto.idCentroCosto = requi.CentroCosto_idCentroCosto inner join departamentos as CCdepartamento on CCdepartamento.idDepartamentos = centrocosto.Departamentos_idDepartamentos inner join direcciones as CCdireccion on CCdireccion.idDirecciones = CCdepartamento.Direcciones_idDirecciones inner join departamentos as DptoUsuario on DptoUsuario.idDepartamentos = usuario.Departamentos_idDepartamentos where requi.estado = 1 order by idRequisiciones desc;');
      conn.end()
     return res.status(200).json(requis[0])
    } catch (error) {
      conn.end()
      return res.status(401).json({ message: 'no autorizado' }) 
    }
}

//ver todas las requisiciones Rechazadas de un usuario
export const showRequisUsuarioRechazadas =async(req:Request,res:Response):Promise<Response>=>{
  const conn = await connect();
  try {
    const toke = req.headers["x-access-token"]?.toString();  
    if(!toke) return res.status(403).json({ message: "sin token" })
    const decoded:any = jwt.verify(toke,config.SECRET);
    if(!decoded) return res.status(404).json({ message:' token invalido '})
    const requis = await conn.query('SELECT idRequisiciones,fecha,justificacion,requiriente.nombre as NomRequiriente, requiriente.apellido as ApeRequiriente, centrocosto.centroCosto,CCdepartamento.departamento as CCdepartamento,CCdireccion.direccion as CCdireccion,centroCosto,bienesOServicios,requi.estado,DptoUsuario.departamento FROM inagua_requis.requisiciones as requi inner join usuarios as requiriente on requiriente.idUsuarios = requi.Usuarios_requiriente inner join usuarios as usuario on usuario.idUsuarios = requi.Usuarios_idUsuarios inner join centrocosto on centrocosto.idCentroCosto = requi.CentroCosto_idCentroCosto inner join departamentos as CCdepartamento on CCdepartamento.idDepartamentos = centrocosto.Departamentos_idDepartamentos inner join direcciones as CCdireccion on CCdireccion.idDirecciones = CCdepartamento.Direcciones_idDirecciones inner join departamentos as DptoUsuario on DptoUsuario.idDepartamentos = usuario.Departamentos_idDepartamentos where requi.estado = 0 and usuario.idUsuarios = ? order by idRequisiciones desc;',[decoded.id]);
    conn.end()
     return res.status(200).json(requis[0])
  } catch (error) {
      conn.end()
      return res.status(401).json({ message: 'no autorizado' }) 
  }
}

//ver todas las requisiciones aprobadas (ya sea por adquisiciones "estado 5" o por caja chica "estado 8")
export const showRequisUsuarioAprobadas =async(req:Request,res:Response):Promise<Response>=>{
  const conn = await connect();
  try {
    const toke = req.headers["x-access-token"]?.toString();  
    if(!toke) return res.status(403).json({ message: "sin token" })
    const decoded:any = jwt.verify(toke,config.SECRET);
    if(!decoded) return res.status(404).json({ message:' token invalido '})
    const requis = await conn.query('SELECT idRequisiciones,fecha,justificacion,requiriente.nombre as NomRequiriente, requiriente.apellido as ApeRequiriente, centrocosto.centroCosto,CCdepartamento.departamento as CCdepartamento,CCdireccion.direccion as CCdireccion,centroCosto,bienesOServicios,requi.estado,DptoUsuario.departamento FROM inagua_requis.requisiciones as requi inner join usuarios as requiriente on requiriente.idUsuarios = requi.Usuarios_requiriente inner join usuarios as usuario on usuario.idUsuarios = requi.Usuarios_idUsuarios inner join centrocosto on centrocosto.idCentroCosto = requi.CentroCosto_idCentroCosto inner join departamentos as CCdepartamento on CCdepartamento.idDepartamentos = centrocosto.Departamentos_idDepartamentos inner join direcciones as CCdireccion on CCdireccion.idDirecciones = CCdepartamento.Direcciones_idDirecciones inner join departamentos as DptoUsuario on DptoUsuario.idDepartamentos = usuario.Departamentos_idDepartamentos where (requi.estado = 5 or requi.estado = 8) and usuario.idUsuarios = ? order by idRequisiciones desc;',[decoded.id]);
    conn.end()
    return res.status(200).json(requis[0])
  } catch (error) {
    conn.end()
      return res.status(401).json({ message: 'no autorizado' }) 
    }
}

//para ver el ultimo rechazo de una requisición en detalles de rechazadas
export const showLastRechazoByIdRequi =async(req:Request,res:Response)=>{
  if(!req.body || !req.header){
    return res.status(400).json({ msg: 'Envia toda la informacion' })
  }
  const arr = req.body;
  let conn:any = null;
  const pool = await connect();
  try {
      const toke = req.headers["x-access-token"]?.toString();  
      if(!toke) return res.status(403).json({ message: "sin token" })
      const decoded:any = jwt.verify(toke,config.SECRET);
      if(!decoded) return res.status(404).json({ message:' token invalido '})
      conn = await pool.getConnection();
      const hist = await conn.query('select * from historial where Requisiciones_idRequisiciones = ? and nuevoEstado = 0 order by fecha desc limit 1',[arr.idRequi]);
      pool.end()
      return res.status(200).json(hist[0])
  } catch (error) {
      pool.end()
      return res.status(401).json({ message: 'no autorizado' }) 
    }
}


//ver todas las requisiciones adquisiciones Solicitudes
export const showRequisAdquisiciones =async(req:Request,res:Response):Promise<Response>=>{
  const conn = await connect();
  try {
      const requis = await conn.query('SELECT idRequisiciones,fecha,justificacion,requiriente.nombre as NomRequiriente, requiriente.apellido as ApeRequiriente, centrocosto.centroCosto,CCdepartamento.departamento as CCdepartamento, CCdireccion.direccion as CCdireccion,centroCosto,bienesOServicios,requi.estado,DptoUsuario.departamento FROM inagua_requis.requisiciones as requi inner join usuarios as requiriente on requiriente.idUsuarios = requi.Usuarios_requiriente inner join usuarios as usuario on usuario.idUsuarios = requi.Usuarios_idUsuarios inner join centrocosto on centrocosto.idCentroCosto = requi.CentroCosto_idCentroCosto inner join departamentos as CCdepartamento on CCdepartamento.idDepartamentos = centrocosto.Departamentos_idDepartamentos inner join direcciones as CCdireccion on CCdireccion.idDirecciones = CCdepartamento.Direcciones_idDirecciones inner join departamentos as DptoUsuario on DptoUsuario.idDepartamentos = usuario.Departamentos_idDepartamentos where requi.estado = 3 order by idRequisiciones desc;');
      conn.end()
     return res.status(200).json(requis[0])
    } catch (error) {
      conn.end()
      return res.status(401).json({ message: 'no autorizado' }) 
    }
}

//ver todas las requisiciones presupuesto para aprobar
export const showRequisPresupuestoAprobacion =async(req:Request,res:Response):Promise<Response>=>{
  const conn = await connect();
  try {
    const requis = await conn.query('SELECT idRequisiciones,fecha,justificacion,requiriente.nombre as NomRequiriente, requiriente.apellido as ApeRequiriente, centrocosto.centroCosto,CCdepartamento.departamento as CCdepartamento,CCdireccion.direccion as CCdireccion,centroCosto,bienesOServicios,requi.estado,DptoUsuario.departamento,sum(mov.cantidad * mov.cUnitarioAprox) as monto_aproximado FROM inagua_requis.requisiciones as requi inner join usuarios as requiriente on requiriente.idUsuarios = requi.Usuarios_requiriente inner join usuarios as usuario on usuario.idUsuarios = requi.Usuarios_idUsuarios inner join centrocosto on centrocosto.idCentroCosto = requi.CentroCosto_idCentroCosto inner join departamentos as CCdepartamento on CCdepartamento.idDepartamentos = centrocosto.Departamentos_idDepartamentos inner join direcciones as CCdireccion on CCdireccion.idDirecciones = CCdepartamento.Direcciones_idDirecciones inner join departamentos as DptoUsuario on DptoUsuario.idDepartamentos = usuario.Departamentos_idDepartamentos inner join movimiento as mov on mov.Requisiciones_idRequisiciones = requi.idRequisiciones where requi.estado = 2 group by requi.idRequisiciones order by idRequisiciones desc;');
    conn.end()
    return res.status(200).json(requis[0])
  } catch (error) {
    conn.end()
      return res.status(401).json({ message: 'no autorizado' }) 
    }
}

//ver todas las requisiciones Adquisiciones para aprobar
export const showRequisAdquisicionesAprobacion =async(req:Request,res:Response):Promise<Response>=>{
  const conn = await connect();
  try {
      const requis = await conn.query('SELECT idRequisiciones,fecha,justificacion,requiriente.nombre as NomRequiriente, requiriente.apellido as ApeRequiriente, centrocosto.centroCosto,CCdepartamento.departamento as CCdepartamento, CCdireccion.direccion as CCdireccion,centroCosto,bienesOServicios,requi.estado,DptoUsuario.departamento FROM inagua_requis.requisiciones as requi inner join usuarios as requiriente on requiriente.idUsuarios = requi.Usuarios_requiriente inner join usuarios as usuario on usuario.idUsuarios = requi.Usuarios_idUsuarios inner join centrocosto on centrocosto.idCentroCosto = requi.CentroCosto_idCentroCosto inner join departamentos as CCdepartamento on CCdepartamento.idDepartamentos = centrocosto.Departamentos_idDepartamentos inner join direcciones as CCdireccion on CCdireccion.idDirecciones = CCdepartamento.Direcciones_idDirecciones inner join departamentos as DptoUsuario on DptoUsuario.idDepartamentos = usuario.Departamentos_idDepartamentos where requi.estado = 4 order by idRequisiciones desc;');
      conn.end()
     return res.status(200).json(requis[0])
    } catch (error) {
      conn.end()
      return res.status(401).json({ message: 'no autorizado' }) 
    }
}

//ver todas las requisiciones Caja Chica para aprobar
export const showRequisCajaChicaAprobacion =async(req:Request,res:Response):Promise<Response>=>{
  const conn = await connect();
  try {
      const requis = await conn.query('SELECT idRequisiciones,fecha,justificacion,requiriente.nombre as NomRequiriente, requiriente.apellido as ApeRequiriente, centrocosto.centroCosto,CCdepartamento.departamento as CCdepartamento, CCdireccion.direccion as CCdireccion,centroCosto,bienesOServicios,requi.estado,DptoUsuario.departamento FROM inagua_requis.requisiciones as requi inner join usuarios as requiriente on requiriente.idUsuarios = requi.Usuarios_requiriente inner join usuarios as usuario on usuario.idUsuarios = requi.Usuarios_idUsuarios inner join centrocosto on centrocosto.idCentroCosto = requi.CentroCosto_idCentroCosto inner join departamentos as CCdepartamento on CCdepartamento.idDepartamentos = centrocosto.Departamentos_idDepartamentos inner join direcciones as CCdireccion on CCdireccion.idDirecciones = CCdepartamento.Direcciones_idDirecciones inner join departamentos as DptoUsuario on DptoUsuario.idDepartamentos = usuario.Departamentos_idDepartamentos where requi.estado = 7 order by idRequisiciones desc;');
      conn.end()
     return res.status(200).json(requis[0])
    } catch (error) {
      conn.end()
      return res.status(401).json({ message: 'no autorizado' }) 
    }
}

//Recibir hoja en presupuesto (el estado de la requisicion debe ser 1)
export const recibirhojaPresupuesto = async(req:Request,res:Response):Promise<Response>=>{
  if(!req.body || !req.header){
    return res.status(400).json({ msg: 'Envia toda la informacion' })
  }
  let msg="";
  let con:any =null;
  const pool = await connect();
  try {
    const toke = req.headers["x-access-token"]?.toString();
    if(!toke) return res.status(403).json({ message: "sin token" })
    const decoded:any = jwt.verify(toke,config.SECRET);
    if(!decoded) return res.status(404).json({ message:' token invalido ' })
    const arr = req.body;
    con = await pool.getConnection();
    const getEstado = await con.query('SELECT estado FROM requisiciones WHERE idRequisiciones = ?',[arr.idRequi]);
    if(getEstado[0][0].estado === 1){
      await con.beginTransaction();
      const update = await con.query('UPDATE requisiciones SET estado = 2 where idRequisiciones = ?',[arr.idRequi]);
      const addHistory = await con.query('INSERT INTO historial(idhistorial,Usuarios_idUsuarios,Requisiciones_idRequisiciones,comentarios,nuevoEstado) values(default,?,?,?,?)',[decoded.id,arr.idRequi,'Hoja recibida en presupuesto',2])
      await con.commit();
      msg = 'success';
      console.log(`HOJA RECIBIDA EN PRESUPUESTO --> ID USUARIO: ${decoded.id} | REQUISICION: ${arr.idRequi} | ${new Date()}`)
    }else{
      msg = 'No es posible actualizar esta requisición'
    }
    pool.end()
    return res.status(200).json({msg:msg})
  } catch (error) {
      if (con) await con.rollback();
        pool.end();
        return res.send(error)
        throw error;
    }
}
//Recibir hoja en Adquisiciones
export const recibirhojaAdquisiciones = async(req:Request,res:Response):Promise<Response>=>{
  if(!req.body || !req.header){
    return res.status(400).json({ msg: 'Envia toda la informacion' })
  }
  let msg = "";
  let con:any =null;
  const pool = await connect();
  try {
    const toke = req.headers["x-access-token"]?.toString();
    if(!toke) return res.status(403).json({ message: "sin token" })
    const decoded:any = jwt.verify(toke,config.SECRET);
    if(!decoded) return res.status(404).json({ message:' token invalido ' })
    const arr = req.body;
    con = await pool.getConnection();
    const getEstado = await con.query('SELECT estado FROM requisiciones WHERE idRequisiciones = ?',[arr.idRequi]);
    if(getEstado[0][0].estado === 3){
      await con.beginTransaction();
      const update = await con.query('UPDATE requisiciones SET estado = 4 where idRequisiciones = ?',[arr.idRequi]);
      const addHistory = await con.query('INSERT INTO historial(idhistorial,Usuarios_idUsuarios,Requisiciones_idRequisiciones,comentarios,nuevoEstado) values(default,?,?,?,?)',[decoded.id,arr.idRequi,'Hoja recibida en Adquisiciones',4])
      await con.commit();
      msg= "success";
      console.log(`HOJA RECIBIDA EN ADQUISICIONES --> ID USUARIO: ${decoded.id} | REQUISICION: ${arr.idRequi} | Time: ${new Date()}`)
    }else{
      msg= "No se pudo actualizar esta requisición"
    }
    pool.end()
    return res.status(200).json({msg:msg})
  } catch (error) {
    if (con) await con.rollback();
        pool.end();
        return res.send(error)
        throw error;
  }
}

//Recibir hoja en Adquisiciones
export const recibirhojaCajaChica = async(req:Request,res:Response):Promise<Response>=>{
  if(!req.body || !req.header){
    return res.status(400).json({ msg: 'Envia toda la informacion' })
  }
  let msg = ""
  let con:any = null;
  const pool = await connect();
  try {
    const toke = req.headers["x-access-token"]?.toString();
    if(!toke) return res.status(403).json({ message: "sin token" })
    const decoded:any = jwt.verify(toke,config.SECRET);
    if(!decoded) return res.status(404).json({ message:' token invalido ' })
    const arr = req.body;
    con = await pool.getConnection();
    const getEstado = await con.query('SELECT estado FROM requisiciones WHERE idRequisiciones = ?',[arr.idRequi]);
    if(getEstado[0][0].estado === 3){
      await con.beginTransaction();
      const update = await con.query('UPDATE requisiciones SET estado = 7 where idRequisiciones = ?',[arr.idRequi]);
      const addHistory = await con.query('INSERT INTO historial(idhistorial,Usuarios_idUsuarios,Requisiciones_idRequisiciones,comentarios,nuevoEstado) values(default,?,?,?,?)',[decoded.id,arr.idRequi,'Hoja recibida en Caja Chica',7])
      await con.commit();
      msg="success"
      console.log(`RECIBIR HOJA CAJA CHICA --> ID Usuario: ${decoded.id} | REQUISICION: ${arr.idRequi} | Time: ${new Date()}`)
    }else{
      msg="No se pudo actualizar esta requisición"
    }
    pool.end()
    return res.status(200).json({msg:msg})
  } catch (error) {
    if (con) await con.rollback();
        pool.end();
        return res.send(error)
        throw error;
  }
}

//aprobar en presupuesto
export const aprobarEnPresupuesto = async(req:Request,res:Response):Promise<Response>=>{
  if(!req.body || !req.header){
    return res.status(400).json({ msg: 'Envia toda la informacion' })
  }
  let msg="";
  let con:any =null;
  const pool = await connect();
  try {
    const toke = req.headers["x-access-token"]?.toString();
    if(!toke) return res.status(403).json({ message: "sin token" })
    const decoded:any = jwt.verify(toke,config.SECRET);
    if(!decoded) return res.status(404).json({ message:' token invalido ' })
    const arr = req.body;
    con = await pool.getConnection();
    const getEstado = await con.query('SELECT estado FROM requisiciones WHERE idRequisiciones = ?',[arr.idRequi]);
    if(getEstado[0][0].estado === 2){
      await con.beginTransaction();
      const update = await con.query('UPDATE requisiciones SET estado = 3 where idRequisiciones = ?',[arr.idRequi]);
      const addHistory = await con.query('INSERT INTO historial(idhistorial,Usuarios_idUsuarios,Requisiciones_idRequisiciones,comentarios,nuevoEstado) values(default,?,?,?,?)',[decoded.id,arr.idRequi,'Aprobada por presupuesto',3])
      await con.commit();
      msg="success";
      console.log(`APROBADA EN PRESUPUESTO --> ${decoded.id} | REQUISICION: ${arr.idRequi} | Time: ${new Date()}`)
    }else{
      msg="No se pudo actualizar esta requisición"
    }
    pool.end()
    return res.status(200).json({msg:msg})
  } catch (error) {
    if (con) await con.rollback();
        pool.end();
        return res.send(error)
        throw error;
  }
}

//aprobar en adquisiciones
export const aprobarEnAdquisiciones = async(req:Request,res:Response):Promise<Response>=>{
  if(!req.body || !req.header){
    return res.status(400).json({ msg: 'Envia toda la informacion' })
  }
  let msg = "";
  let con:any =null;
  const pool = await connect();
  try {
    const toke = req.headers["x-access-token"]?.toString();
    if(!toke) return res.status(403).json({ message: "sin token" })

    const decoded:any = jwt.verify(toke,config.SECRET);
    if(!decoded) return res.status(404).json({ message:' token invalido ' })

    const arr = req.body;
    con = await pool.getConnection();
    await con.beginTransaction();
    const getEstado = await con.query('SELECT estado FROM requisiciones WHERE idRequisiciones = ?',[arr.idRequi]);
    if(getEstado[0][0].estado === 4){
      const update = await con.query('UPDATE requisiciones SET estado = 5 where idRequisiciones = ?',[arr.idRequi]);
      const addHistory = await con.query('INSERT INTO historial(idhistorial,Usuarios_idUsuarios,Requisiciones_idRequisiciones,comentarios,nuevoEstado) values(default,?,?,?,?)',[decoded.id,arr.idRequi,'Aprobada por Adquisiciones',5])
      await con.commit();
      msg="success";
      console.log(`APROBADA EN ADQUISICIONES --> ID Usuario: ${decoded.id} | REQUISICION: ${arr.idRequi} | Time: ${new Date()}`)
    }else{
      msg="No se pudo actualizar esta requisición";
    }
    pool.end()
    return res.status(200).json({msg:msg})
  } catch (error) {
    if (con) await con.rollback();
      pool.end();
      return res.send(error)
      throw error;
  }
}

//aprobar en Caja Chica
export const aprobarEnCajaChica = async(req:Request,res:Response):Promise<Response>=>{
  if(!req.body || !req.header){
    return res.status(400).json({ msg: 'Envia toda la informacion' })
  }
let msg = ""
let con:any =null;
const pool = await connect();
  try {
    const toke = req.headers["x-access-token"]?.toString();
    if(!toke) return res.status(403).json({ message: "sin token" })
    const decoded:any = jwt.verify(toke,config.SECRET);
    if(!decoded) return res.status(404).json({ message:' token invalido ' })
    const arr = req.body;
    con = await pool.getConnection();
    await con.beginTransaction();
    const getEstado = await con.query('SELECT estado FROM inagua_requis.requisiciones where idRequisiciones = ?',[arr.idRequi])
    if(getEstado[0][0].estado === 7){
      const update = await con.query('UPDATE requisiciones SET estado = 8 where idRequisiciones = ?',[arr.idRequi]);
      const addHistory = await con.query('INSERT INTO historial(idhistorial,Usuarios_idUsuarios,Requisiciones_idRequisiciones,comentarios,nuevoEstado) values(default,?,?,?,?)',[decoded.id,arr.idRequi,'Aprobada por Caja Chica',8])
      await con.commit();
      msg= "success"
      console.log(`RECIBIR HOJA CAJA CHICA: ID Usuario --> ${decoded.id} | REQUISICION: ${arr.idRequi} | Time: ${new Date()}`)
    }else{
      msg= "No es posible actualizar esta requisición"
    }
      pool.end()
      return res.status(200).json({msg:msg})
  } catch (error) {
    if (con) await con.rollback();
      pool.end();
      return res.send(error)
      throw error;
  }
}

//rechazar en presupuesto
export const rechazarEnPresupuesto = async(req:Request,res:Response):Promise<Response>=>{
  if(!req.body || !req.header){
    return res.status(400).json({ msg: 'Envia toda la informacion' })
}
let msg = "";
let con:any =null;
const pool = await connect();
  try {
    const toke = req.headers["x-access-token"]?.toString();
    if(!toke) return res.status(403).json({ message: "sin token" })
    const decoded:any = jwt.verify(toke,config.SECRET);
    if(!decoded) return res.status(404).json({ message:' token invalido ' })
    const arr = req.body;
    con = await pool.getConnection();
    await con.beginTransaction();
    const getEstado = await con.query('SELECT estado FROM requisiciones WHERE idRequisiciones = ?',[arr.idRequi]);
    if(getEstado[0][0].estado === 2){
      const update = await con.query('UPDATE requisiciones SET estado = 0 where idRequisiciones = ?',[arr.idRequi]);
      const addHistory = await con.query('INSERT INTO historial(idhistorial,Usuarios_idUsuarios,Requisiciones_idRequisiciones,comentarios,nuevoEstado) values(default,?,?,?,?)',[decoded.id,arr.idRequi,arr.msgRechazo,0])
      await con.commit();
      msg = "success"
      console.log(`RECHAZADA EN PRESUPUESTO: ID Usuario --> ${decoded.id} | REQUISICION: ${arr.idRequi} | Time: ${new Date()}`)

    }else{
      msg = "No se pudo actualizar la requisición"
    }
    pool.end();
    return res.status(200).json({msg:msg})
  } catch (error) {
    if (con) await con.rollback();
        pool.end();
        return res.send(error)
        throw error;
  }
}

export const rechazarEnAdquisiciones = async(req:Request,res:Response):Promise<Response>=>{
  if(!req.body || !req.header){
    return res.status(400).json({ msg: 'Envia toda la informacion' })
  }
  let msg = "";
  let con:any =null;
  const pool = await connect();
  try {
    const toke = req.headers["x-access-token"]?.toString();
    if(!toke) return res.status(403).json({ message: "sin token" })
    const decoded:any = jwt.verify(toke,config.SECRET);
    if(!decoded) return res.status(404).json({ message:' token invalido ' })
    const arr = req.body;
    con = await pool.getConnection();
    const getEstado = await con.query('SELECT estado FROM requisiciones WHERE idRequisiciones = ?',[arr.idRequi]);
    if(getEstado[0][0].estado === 4){
      await con.beginTransaction();
      const update = await con.query('UPDATE requisiciones SET estado = 0 where idRequisiciones = ?',[arr.idRequi]);
      const addHistory = await con.query('INSERT INTO historial(idhistorial,Usuarios_idUsuarios,Requisiciones_idRequisiciones,comentarios,nuevoEstado) values(default,?,?,?,?)',[decoded.id,arr.idRequi,arr.msgRechazo,0])
      await con.commit();
      msg="success"
      console.log(`RECHAZADA EN ANDQUISICIONES: ID Usuario --> ${decoded.id} | REQUISICION: ${arr.idRequi} | Time: ${new Date()}`)
    }else{
      msg="No se pudo actualizar la requisición"
    }
    pool.end()
    return res.status(200).json({msg:msg})
  } catch (error) {
    if (con) await con.rollback();
      pool.end();
      return res.send(error)
      throw error;
  }
}

export const rechazarEnCajaChica = async(req:Request,res:Response):Promise<Response>=>{
  if(!req.body || !req.header){
    return res.status(400).json({ msg: 'Envia toda la informacion' })
}
let con:any =null;
let msg:any='';
const pool = await connect();
  try {
    const toke = req.headers["x-access-token"]?.toString();
    if(!toke) return res.status(403).json({ message: "sin token" })
    const decoded:any = jwt.verify(toke,config.SECRET);
    if(!decoded) return res.status(404).json({ message:' token invalido ' })
    const arr = req.body;
    con = await pool.getConnection();
    const estadoActual = await con.query('Select estado from requisiciones where idRequisiciones = ?',[arr.idRequi])
    if(estadoActual[0][0].estado === 7){
      await con.beginTransaction();
      const update = await con.query('UPDATE requisiciones SET estado = 0 where idRequisiciones = ?',[arr.idRequi]);
      const addHistory = await con.query('INSERT INTO historial(idhistorial,Usuarios_idUsuarios,Requisiciones_idRequisiciones,comentarios,nuevoEstado) values(default,?,?,?,?)',[decoded.id,arr.idRequi,arr.msgRechazo,0])
      await con.commit();
      msg='success'
      console.log(`RECHAZADA EN CAJA CHICA: ID Usuario --> ${decoded.id} | REQUISICION: ${arr.idRequi} | Time: ${new Date()}`)

    }else{
      msg='Error al realizar el rechazo'
    }
    pool.end()
    return res.status(200).json({msg:msg})
  } catch (error) {
    if (con) await con.rollback();
        pool.end();
        return res.send(error)
        throw error;
  }
}


//ver todas las requisiciones de un usuario

//antigua consulta

//SELECT idRequisiciones,fecha,justificacion,requiriente.nombre as NomRequiriente, requiriente.apellido as ApeRequiriente, centrocosto.centroCosto,CCdepartamento.departamento as CCdepartamento, CCdireccion.direccion as CCdireccion,centroCosto,bienesOServicios, requi.estado FROM inagua_requis.requisiciones as requi inner join usuarios as requiriente on requiriente.idUsuarios = requi.Usuarios_requiriente inner join usuarios as usuario on usuario.idUsuarios = requi.Usuarios_idUsuarios inner join centrocosto on centrocosto.idCentroCosto = requi.CentroCosto_idCentroCosto inner join departamentos as CCdepartamento on CCdepartamento.idDepartamentos = centrocosto.Departamentos_idDepartamentos inner join direcciones as CCdireccion on CCdireccion.idDirecciones = CCdepartamento.Direcciones_idDirecciones where usuario.idUsuarios = ? order by idRequisiciones desc;


export const showRequisByUser =async(req:Request,res:Response):Promise<Response>=>{
  const conn = await connect();
  try {
    const toke = req.headers["x-access-token"]?.toString();
    if(!toke) return res.status(403).json({ message: "sin token" })
    const decoded:any = jwt.verify(toke,config.SECRET);
    if(!decoded) return res.status(404).json({ message:' token invalido ' })
    const requis = await conn.query('SELECT  requi.idRequisiciones,requi.fecha,requi.justificacion,requiriente.nombre as NomRequiriente, requiriente.apellido as ApeRequiriente, centrocosto.centroCosto,CCdepartamento.departamento as CCdepartamento, CCdireccion.direccion as CCdireccion,centroCosto,bienesOServicios, requi.estado,datediff(now(),c.fecha) as lastF FROM requisiciones requi INNER JOIN historial c ON requi.idRequisiciones = c.Requisiciones_idRequisiciones INNER JOIN ( SELECT Requisiciones_idRequisiciones, MAX(fecha) maxDate FROM historial GROUP BY Requisiciones_idRequisiciones ) b ON c.Requisiciones_idRequisiciones = b.Requisiciones_idRequisiciones AND c.fecha = b.maxDate inner join usuarios as requiriente on requiriente.idUsuarios = requi.Usuarios_requiriente inner join usuarios as usuario on usuario.idUsuarios = requi.Usuarios_idUsuarios inner join centrocosto on centrocosto.idCentroCosto = requi.CentroCosto_idCentroCosto inner join departamentos as CCdepartamento on CCdepartamento.idDepartamentos = centrocosto.Departamentos_idDepartamentos inner join direcciones as CCdireccion on CCdireccion.idDirecciones = CCdepartamento.Direcciones_idDirecciones WHERE requi.Usuarios_idUsuarios = ? order by requi.idRequisiciones desc',[decoded.id])
    conn.end()
    return res.status(200).json(requis[0])
  } catch (error) {
    conn.end()
    return res.status(401).json(error)
  }
} 

//Requisición por id usuario e id requisicion (buscador)
export const findUserRequiById =async(req:Request,res:Response):Promise<Response>=>{
  const conn = await connect();
  try {
    const toke = req.headers["x-access-token"]?.toString();
    if(!toke) return res.status(403).json({ message: "sin token" })
    const decoded:any = jwt.verify(toke,config.SECRET);
    if(!decoded) return res.status(404).json({ message:' token invalido ' })
    const idRequi = req.body.idRequi;
    const requis:any = await conn.query('SELECT idRequisiciones,fecha,justificacion,requiriente.nombre as NomRequiriente, requiriente.apellido as ApeRequiriente, centrocosto.centroCosto,CCdepartamento.departamento as CCdepartamento, CCdireccion.direccion as CCdireccion,centroCosto,bienesOServicios,requi.estado FROM inagua_requis.requisiciones as requi inner join usuarios as requiriente on requiriente.idUsuarios = requi.Usuarios_requiriente inner join usuarios as usuario on usuario.idUsuarios = requi.Usuarios_idUsuarios inner join centrocosto on centrocosto.idCentroCosto = requi.CentroCosto_idCentroCosto inner join departamentos as CCdepartamento on CCdepartamento.idDepartamentos = centrocosto.Departamentos_idDepartamentos inner join direcciones as CCdireccion on CCdireccion.idDirecciones = CCdepartamento.Direcciones_idDirecciones where usuario.idUsuarios = ? and requi.idRequisiciones = ? order by idRequisiciones desc;',[decoded.id,idRequi]);
    conn.end()
    return res.status(200).json(requis[0]);
  } catch (error) {
    conn.end()
    return res.status(401).json(error);
  }
}

//Requisición por id usuario e id requisicion (buscador) Aprobadas
export const findUserRequiByIdAprobadas =async(req:Request,res:Response):Promise<Response>=>{
  const conn = await connect();
  try {
    const toke = req.headers["x-access-token"]?.toString();
    if(!toke) return res.status(403).json({ message: "sin token" })
    const decoded:any = jwt.verify(toke,config.SECRET);
    if(!decoded) return res.status(404).json({ message:' token invalido ' })
    const idRequi = req.body.idRequi;
    const requis:any = await conn.query('SELECT idRequisiciones,fecha,justificacion,requiriente.nombre as NomRequiriente, requiriente.apellido as ApeRequiriente, centrocosto.centroCosto,CCdepartamento.departamento as CCdepartamento, CCdireccion.direccion as CCdireccion,centroCosto,bienesOServicios,requi.estado FROM inagua_requis.requisiciones as requi inner join usuarios as requiriente on requiriente.idUsuarios = requi.Usuarios_requiriente inner join usuarios as usuario on usuario.idUsuarios = requi.Usuarios_idUsuarios inner join centrocosto on centrocosto.idCentroCosto = requi.CentroCosto_idCentroCosto inner join departamentos as CCdepartamento on CCdepartamento.idDepartamentos = centrocosto.Departamentos_idDepartamentos inner join direcciones as CCdireccion on CCdireccion.idDirecciones = CCdepartamento.Direcciones_idDirecciones where usuario.idUsuarios = ? and requi.idRequisiciones = ? and requi.estado = 5 order by idRequisiciones desc;',[decoded.id,idRequi]);
    conn.end()
    return res.status(200).json(requis[0]);
  } catch (error) {
    conn.end()
    return res.status(401).json(error);
  }
}

//ver todas las requisiciones del departamento segun usuario
export const showRequisByDepartamentoUsuario =async(req:Request,res:Response):Promise<Response>=>{
  const conn = await connect();
  try {
    const toke = req.headers["x-access-token"]?.toString();
    if(!toke) return res.status(403).json({ message: "sin token" })
    const decoded:any = jwt.verify(toke,config.SECRET);
    if(!decoded) return res.status(404).json({ message:' token invalido ' })
    const requis = await conn.query('SELECT idRequisiciones,fecha,justificacion,nombre,apellido,departamento,direccion,centroCosto,bienesOServicios  FROM inagua_requis.requisiciones inner join usuarios on usuarios.idUsuarios = requisiciones.Usuarios_idUsuarios inner join centrocosto on centroCosto.idCentroCosto = requisiciones.CentroCosto_idCentroCosto inner join departamentos on departamentos.idDepartamentos = centroCosto.Departamentos_idDepartamentos inner join direcciones on direcciones.idDirecciones = centroCosto.Direcciones_idDirecciones where departamentos.idDepartamentos in (select  Departamentos_idDepartamentos from usuarios inner join centrocosto on centroCosto.idCentroCosto = usuarios.CentroCosto_idCentroCosto where usuarios.idUsuarios = ?) order by idRequisiciones desc;',[decoded.id])
    conn.end()
    return res.status(200).json(requis[0])
  } catch (error) {
    conn.end()
    return res.status(401).json(error)
  }
} 

//ver una sola requisicion por id ( presupuesto )
export const showRequiByIdPresupuestoAprobaciones =async(req:Request,res:Response):Promise<Response>=>{
  if(!req.body){ res.status(400).json({msg: 'envia toda la informacion'})}
  const idRequi = req.body.idRequi;
  const conn = await connect();
  try {
    const requi = await conn.query('Select requi.idRequisiciones,requi.fecha,requi.justificacion,requiriente.nombre as NomRequiriente,bienesOServicios, requiriente.apellido as ApeRequiriente, centrocosto.centroCosto,CCdepartamento.departamento as CCdepartamento, CCdireccion.direccion as CCdireccion,director.nombre as NomDirector, director.apellido as ApeDirector from requisiciones as requi inner join usuarios as requiriente on requiriente.idUsuarios = requi.Usuarios_requiriente inner join usuarios as usuario on usuario.idUsuarios = requi.Usuarios_idUsuarios inner join centrocosto on centrocosto.idCentroCosto = requi.CentroCosto_idCentroCosto inner join departamentos as CCdepartamento on CCdepartamento.idDepartamentos = centrocosto.Departamentos_idDepartamentos inner join direcciones as CCdireccion on CCdireccion.idDirecciones = CCdepartamento.Direcciones_idDirecciones inner join directores as director on director.idDirectores = requi.Directores_idDirectores where requi.idRequisiciones = ? and estado = 2',[idRequi]);
    conn.end()
   return res.status(200).json(requi[0])
  } catch (error) {
    conn.end()
    return res.status(401).json(error) 
  }
}

//ver una sola requisicion por id ( Adquisiciones )
export const showRequiByIdAdquisicionesAprobaciones =async(req:Request,res:Response):Promise<Response>=>{
  if(!req.body){ res.status(400).json({msg: 'envia toda la informacion'})}
  const idRequi = req.body.idRequi;
  const conn = await connect();
  try {
    const requi = await conn.query('Select requi.idRequisiciones,requi.fecha,requi.justificacion,requiriente.nombre as NomRequiriente,bienesOServicios, requiriente.apellido as ApeRequiriente, centrocosto.centroCosto,CCdepartamento.departamento as CCdepartamento, CCdireccion.direccion as CCdireccion,director.nombre as NomDirector, director.apellido as ApeDirector from requisiciones as requi inner join usuarios as requiriente on requiriente.idUsuarios = requi.Usuarios_requiriente inner join usuarios as usuario on usuario.idUsuarios = requi.Usuarios_idUsuarios inner join centrocosto on centrocosto.idCentroCosto = requi.CentroCosto_idCentroCosto inner join departamentos as CCdepartamento on CCdepartamento.idDepartamentos = centrocosto.Departamentos_idDepartamentos inner join direcciones as CCdireccion on CCdireccion.idDirecciones = CCdepartamento.Direcciones_idDirecciones inner join directores as director on director.idDirectores = requi.Directores_idDirectores where requi.idRequisiciones = ? and estado = 4',[idRequi]);
    conn.end()
   return res.status(200).json(requi[0])
  } catch (error) {
    conn.end()
    return res.status(401).json(error) 
  }
}

//ver una sola requisicion por id ( Caja chica aprobaciones )
export const showRequiByIdCajaChicaAprobaciones =async(req:Request,res:Response):Promise<Response>=>{
  if(!req.body){ res.status(400).json({msg: 'envia toda la informacion'})}
  const idRequi = req.body.idRequi;
  const conn = await connect();
  try {
    const requi = await conn.query('Select requi.idRequisiciones,requi.fecha,requi.justificacion,requiriente.nombre as NomRequiriente,bienesOServicios, requiriente.apellido as ApeRequiriente, centrocosto.centroCosto,CCdepartamento.departamento as CCdepartamento, CCdireccion.direccion as CCdireccion,director.nombre as NomDirector, director.apellido as ApeDirector from requisiciones as requi inner join usuarios as requiriente on requiriente.idUsuarios = requi.Usuarios_requiriente inner join usuarios as usuario on usuario.idUsuarios = requi.Usuarios_idUsuarios inner join centrocosto on centrocosto.idCentroCosto = requi.CentroCosto_idCentroCosto inner join departamentos as CCdepartamento on CCdepartamento.idDepartamentos = centrocosto.Departamentos_idDepartamentos inner join direcciones as CCdireccion on CCdireccion.idDirecciones = CCdepartamento.Direcciones_idDirecciones inner join directores as director on director.idDirectores = requi.Directores_idDirectores where requi.idRequisiciones = ? and estado = 7',[idRequi]);
    conn.end()
   return res.status(200).json(requi[0])
  } catch (error) {
    conn.end()
    return res.status(401).json(error) 
  }
}

//ver una sola requisicion por id ( presupuesto )
export const showRequiByIdPresupuesto =async(req:Request,res:Response):Promise<Response>=>{
  if(!req.body){ res.status(400).json({msg: 'envia toda la informacion'})}
  const idRequi = req.body.idRequi;
  const conn = await connect();
  try {
    const requi = await conn.query('Select requi.idRequisiciones,requi.fecha,requi.justificacion,requiriente.nombre as NomRequiriente,bienesOServicios, requiriente.apellido as ApeRequiriente, centrocosto.centroCosto,CCdepartamento.departamento as CCdepartamento, CCdireccion.direccion as CCdireccion,director.nombre as NomDirector, director.apellido as ApeDirector, requi.estado from requisiciones as requi inner join usuarios as requiriente on requiriente.idUsuarios = requi.Usuarios_requiriente inner join usuarios as usuario on usuario.idUsuarios = requi.Usuarios_idUsuarios inner join centrocosto on centrocosto.idCentroCosto = requi.CentroCosto_idCentroCosto inner join departamentos as CCdepartamento on CCdepartamento.idDepartamentos = centrocosto.Departamentos_idDepartamentos inner join direcciones as CCdireccion on CCdireccion.idDirecciones = CCdepartamento.Direcciones_idDirecciones inner join directores as director on director.idDirectores = requi.Directores_idDirectores where requi.idRequisiciones = ? and estado = 1',[idRequi]);
    conn.end()
   return res.status(200).json(requi[0])
  } catch (error) {
    conn.end()
    return res.status(401).json(error) 
  }
}

//ver una sola requisicion por id ( historial )
export const showRequiByIdHistorial =async(req:Request,res:Response):Promise<Response>=>{
  if(!req.body){ res.status(400).json({msg: 'envia toda la informacion'})}
  const idRequi = req.body.idRequi;
  const conn = await connect();
  try {
    const requi = await conn.query('Select requi.idRequisiciones,requi.fecha,requi.justificacion,requiriente.nombre as NomRequiriente,bienesOServicios, requiriente.apellido as ApeRequiriente, centrocosto.centroCosto,CCdepartamento.departamento as CCdepartamento, CCdireccion.direccion as CCdireccion,director.nombre as NomDirector, director.apellido as ApeDirector,requi.estado from requisiciones as requi inner join usuarios as requiriente on requiriente.idUsuarios = requi.Usuarios_requiriente inner join usuarios as usuario on usuario.idUsuarios = requi.Usuarios_idUsuarios inner join centrocosto on centrocosto.idCentroCosto = requi.CentroCosto_idCentroCosto inner join departamentos as CCdepartamento on CCdepartamento.idDepartamentos = centrocosto.Departamentos_idDepartamentos inner join direcciones as CCdireccion on CCdireccion.idDirecciones = CCdepartamento.Direcciones_idDirecciones inner join directores as director on director.idDirectores = requi.Directores_idDirectores where requi.idRequisiciones = ?',[idRequi]);
    conn.end()
   return res.status(200).json(requi[0])
  } catch (error) {
    conn.end()
    return res.status(401).json(error) 
  }
}

//ver una sola requisicion por id ( Adquisiciones )
export const showRequiByIdAdquisiciones =async(req:Request,res:Response):Promise<Response>=>{
  if(!req.body){ res.status(400).json({msg: 'envia toda la informacion'})}
  const idRequi = req.body.idRequi;
  const conn = await connect();
  try {
    const requi = await conn.query('Select requi.idRequisiciones,requi.fecha,requi.justificacion,requiriente.nombre as NomRequiriente,bienesOServicios, requiriente.apellido as ApeRequiriente, centrocosto.centroCosto,CCdepartamento.departamento as CCdepartamento, CCdireccion.direccion as CCdireccion,director.nombre as NomDirector, director.apellido as ApeDirector,requi.estado from requisiciones as requi inner join usuarios as requiriente on requiriente.idUsuarios = requi.Usuarios_requiriente inner join usuarios as usuario on usuario.idUsuarios = requi.Usuarios_idUsuarios inner join centrocosto on centrocosto.idCentroCosto = requi.CentroCosto_idCentroCosto inner join departamentos as CCdepartamento on CCdepartamento.idDepartamentos = centrocosto.Departamentos_idDepartamentos inner join direcciones as CCdireccion on CCdireccion.idDirecciones = CCdepartamento.Direcciones_idDirecciones inner join directores as director on director.idDirectores = requi.Directores_idDirectores where requi.idRequisiciones = ? and estado = 3',[idRequi]);
    conn.end()
   return res.status(200).json(requi[0])
  } catch (error) {
    conn.end()
  return res.status(401).json(error) 
  }
}

//ver una sola requisicion por id ( presupuesto Details)
export const showRequiByIdDetailsPresupuesto =async(req:Request,res:Response):Promise<Response>=>{
  if(!req.body){ res.status(400).json({msg: 'envia toda la informacion'})}
  const idRequi = req.body.idRequi;
  const conn = await connect();
  try {
    const requi = await conn.query('Select requi.idRequisiciones,requi.fecha,requi.justificacion,requiriente.nombre as NomRequiriente, requiriente.apellido as ApeRequiriente,centrocosto.centroCosto,CCdepartamento.departamento as CCdepartamento, CCdireccion.direccion as CCdireccion,director.nombre as NomDirector,director.apellido as ApeDirector,requi.gastoCorriente, requi.recursoPropio, requi.recursoOtros,requi.descOtros, requi.estado,requi.bienesOServicios,Rdepartamento.departamento as RDepartamento,Rdireccion.direccion as RDireccion from requisiciones as requi inner join usuarios as requiriente on requiriente.idUsuarios = requi.Usuarios_requiriente inner join usuarios as usuario on usuario.idUsuarios = requi.Usuarios_idUsuarios inner join centrocosto on centrocosto.idCentroCosto = requi.CentroCosto_idCentroCosto inner join departamentos as CCdepartamento on CCdepartamento.idDepartamentos = centrocosto.Departamentos_idDepartamentos inner join direcciones as CCdireccion on CCdireccion.idDirecciones = CCdepartamento.Direcciones_idDirecciones inner join departamentos as Rdepartamento on Rdepartamento.idDepartamentos = requiriente.Departamentos_idDepartamentos inner join direcciones as Rdireccion on Rdireccion.idDirecciones = Rdepartamento.Direcciones_idDirecciones inner join directores as director on director.idDirectores = requi.Directores_idDirectores where requi.idRequisiciones = ?',[idRequi]);
    conn.end()
   return res.status(200).json(requi[0])
  } catch (error) {
    conn.end()
    return res.status(401).json(error) 
  }
}

//Obtener Detalles para editar
export const getDetailsToEdit =async(req:Request,res:Response):Promise<Response>=>{
  if(!req.body){ res.status(400).json({msg: 'envia toda la informacion'})}
  const idRequi = req.body.idRequi;
  const conn = await connect();
  try {
    const requi = await conn.query('Select requi.idRequisiciones,requi.Directores_idDirectores,requi.Usuarios_requiriente,requi.bienesOServicios,requi.fecha,requi.justificacion,requiriente.nombre as NomRequiriente, requiriente.apellido as ApeRequiriente, centrocosto.centroCosto,CCdepartamento.departamento as CCdepartamento, CCdireccion.direccion as CCdireccion,director.nombre as NomDirector, director.apellido as ApeDirector,requi.gastoCorriente, requi.recursoPropio, requi.recursoOtros,requi.descOtros from requisiciones as requi inner join usuarios as requiriente on requiriente.idUsuarios = requi.Usuarios_requiriente inner join usuarios as usuario on usuario.idUsuarios = requi.Usuarios_idUsuarios inner join centrocosto on centrocosto.idCentroCosto = requi.CentroCosto_idCentroCosto inner join departamentos as CCdepartamento on CCdepartamento.idDepartamentos = centrocosto.Departamentos_idDepartamentos inner join direcciones as CCdireccion on CCdireccion.idDirecciones = CCdepartamento.Direcciones_idDirecciones inner join directores as director on director.idDirectores = requi.Directores_idDirectores where requi.idRequisiciones = ?',[idRequi]);
    conn.end()
   return res.status(200).json(requi[0])
  } catch (error) {
    conn.end()
    return res.status(401).json(error) 
  }
}

export const showRequiByIdDetailsUsuario =async(req:Request,res:Response):Promise<Response>=>{
  if(!req.body){ res.status(400).json({msg: 'envia toda la informacion'})}
  const idRequi = req.body.idRequi;
  const conn = await connect();
  try {
    const requi = await conn.query('Select requi.idRequisiciones,requi.fecha,requi.justificacion,requiriente.nombre as NomRequiriente, requiriente.apellido as ApeRequiriente, centrocosto.centroCosto,CCdepartamento.departamento as CCdepartamento, CCdireccion.direccion as CCdireccion,director.nombre as NomDirector, director.apellido as ApeDirector,requi.gastoCorriente, requi.recursoPropio, requi.recursoOtros,requi.descOtros, requi.estado, requi.bienesOServicios,Rdepartamento.departamento as RDepartamento,Rdireccion.direccion as RDireccion  from requisiciones as requi inner join usuarios as requiriente on requiriente.idUsuarios = requi.Usuarios_requiriente inner join usuarios as usuario on usuario.idUsuarios = requi.Usuarios_idUsuarios inner join centrocosto on centrocosto.idCentroCosto = requi.CentroCosto_idCentroCosto inner join departamentos as CCdepartamento on CCdepartamento.idDepartamentos = centrocosto.Departamentos_idDepartamentos inner join direcciones as CCdireccion on CCdireccion.idDirecciones = CCdepartamento.Direcciones_idDirecciones inner join departamentos as Rdepartamento on Rdepartamento.idDepartamentos = requiriente.Departamentos_idDepartamentos inner join direcciones as Rdireccion on Rdireccion.idDirecciones = Rdepartamento.Direcciones_idDirecciones inner join directores as director on director.idDirectores = requi.Directores_idDirectores where requi.idRequisiciones = ?',[idRequi]);
    conn.end()
   return res.status(200).json(requi[0])
  } catch (error) {
    conn.end()
    return res.status(401).json(error) 
  }
}


//movimientos por id requisicion
export const showMovimientosById = async(req:Request,res:Response):Promise<Response>=>{
  if(!req.body){ res.status(400).json({msg: 'envia toda la informacion'})}
  const idRequi = req.body.idRequi;
  const con = await connect();
  try {
    const movs:any = await con.query('SELECT idMovimiento,descripcion,cantidad,Unidades_idUnidades,cUnitarioAprox from movimiento where Requisiciones_idRequisiciones = ?',[idRequi]);
    con.end();
    if(movs[0].length === 0){return res.status(204).json('')}
    return res.status(200).json(movs[0])
  } catch (error) {
    con.end();
    return res.status(401).json(error) 
  }
}

//movimientos por id requisicion to edit
export const showMovimientosByIdEdit = async(req:Request,res:Response):Promise<Response>=>{
  if(!req.body){ res.status(400).json({msg: 'envia toda la informacion'})}
  const idRequi = req.body.idRequi;
  const con = await connect();
  try {
    const movs:any = await con.query('SELECT idMovimiento,descripcion,cantidad,Unidades_idUnidades,cUnitarioAprox from movimiento where Requisiciones_idRequisiciones = ?',[idRequi]);
    con.end();
    if(movs[0].length === 0){return res.status(204).json('')}
    return res.status(200).json(movs[0])
  } catch (error) {
    con.end()
    return res.status(401).json(error) 
  }
}

//obtener hora
export const getFecha =async(req:Request,res:Response):Promise<Response>=>{
  try {
    const fecha = new Date().toISOString().slice(0,10);
    return res.status(200).json({fecha:fecha})
  } catch (error) {
    return res.status(401).json(error)
  }
}

//Requisiciones para historial Director plus
//antigua consulta
//SELECT idRequisiciones,fecha,justificacion,requiriente.nombre as NomRequiriente, requiriente.apellido as ApeRequiriente, centrocosto.centroCosto,CCdepartamento.departamento as CCdepartamento, CCdireccion.direccion as CCdireccion,centroCosto,bienesOServicios, requi.estado FROM inagua_requis.requisiciones as requi inner join usuarios as requiriente on requiriente.idUsuarios = requi.Usuarios_requiriente inner join usuarios as usuario on usuario.idUsuarios = requi.Usuarios_idUsuarios inner join centrocosto on centrocosto.idCentroCosto = requi.CentroCosto_idCentroCosto inner join departamentos as CCdepartamento on CCdepartamento.idDepartamentos = centrocosto.Departamentos_idDepartamentos inner join direcciones as CCdireccion on CCdireccion.idDirecciones = CCdepartamento.Direcciones_idDirecciones order by idRequisiciones desc;

export const showAllRequis = async(req:Request,res:Response):Promise<Response>=>{
  const con = await connect();
  try {
    const requis = await con.query('SELECT idRequisiciones,requi.fecha,justificacion,requiriente.nombre as NomRequiriente, requiriente.apellido as ApeRequiriente, centrocosto.centroCosto,CCdepartamento.departamento as CCdepartamento,CCdireccion.direccion as CCdireccion,centroCosto,bienesOServicios, requi.estado,datediff(now(),c.fecha) as lastF FROM inagua_requis.requisiciones as requi INNER JOIN historial c ON requi.idRequisiciones = c.Requisiciones_idRequisiciones INNER JOIN ( SELECT Requisiciones_idRequisiciones, MAX(fecha) maxDate FROM historial GROUP BY Requisiciones_idRequisiciones ) b ON c.Requisiciones_idRequisiciones = b.Requisiciones_idRequisiciones AND c.fecha = b.maxDate inner join usuarios as requiriente on requiriente.idUsuarios = requi.Usuarios_requiriente inner join usuarios as usuario on usuario.idUsuarios = requi.Usuarios_idUsuarios inner join centrocosto on centrocosto.idCentroCosto = requi.CentroCosto_idCentroCosto inner join departamentos as CCdepartamento on CCdepartamento.idDepartamentos = centrocosto.Departamentos_idDepartamentos inner join direcciones as CCdireccion on CCdireccion.idDirecciones = CCdepartamento.Direcciones_idDirecciones order by requi.idRequisiciones desc;');
    con.end();
    return res.status(200).json(requis[0])
  } catch (error) {
    con.end()
    return res.status(401).json(error) 
  }
}

//Requisiciones para historial Director
export const showRequisDirector = async(req:Request,res:Response):Promise<Response>=>{
  const con = await connect();
  try {
    const toke = req.headers["x-access-token"]?.toString();
    if(!toke) return res.status(403).json({ message: "sin token" })
    const decoded:any = jwt.verify(toke,config.SECRET);
    if(!decoded) return res.status(404).json({ message:' token invalido ' })
    const direccion:any = await con.query('select idDirecciones from usuarios inner join departamentos as dpto on dpto.idDepartamentos = usuarios.Departamentos_idDepartamentos inner join direcciones as direc on direc.idDirecciones = dpto.Direcciones_idDirecciones where usuarios.idUsuarios = ?',[decoded.id]);
    const idDireccion =direccion[0][0]['idDirecciones'];
    const requis = await con.query('SELECT idRequisiciones,requi.fecha,justificacion,requiriente.nombre as NomRequiriente, requiriente.apellido as ApeRequiriente, centrocosto.centroCosto,CCdepartamento.departamento as CCdepartamento,CCdireccion.direccion as CCdireccion,centroCosto,bienesOServicios, requi.estado ,usuario.Departamentos_idDepartamentos,direc.idDirecciones,datediff(now(),c.fecha) as lastF FROM inagua_requis.requisiciones as requi inner join usuarios as requiriente on requiriente.idUsuarios = requi.Usuarios_requiriente inner join usuarios as usuario on usuario.idUsuarios = requi.Usuarios_idUsuarios inner join centrocosto on centrocosto.idCentroCosto = requi.CentroCosto_idCentroCosto inner join departamentos as CCdepartamento on CCdepartamento.idDepartamentos = centrocosto.Departamentos_idDepartamentos inner join direcciones as CCdireccion on CCdireccion.idDirecciones = CCdepartamento.Direcciones_idDirecciones inner join departamentos as dpto on dpto.idDepartamentos = usuario.Departamentos_idDepartamentos inner join direcciones as direc on direc.idDirecciones = dpto.Direcciones_idDirecciones INNER JOIN historial c ON requi.idRequisiciones = c.Requisiciones_idRequisiciones INNER JOIN ( SELECT Requisiciones_idRequisiciones, MAX(fecha) maxDate FROM historial GROUP BY Requisiciones_idRequisiciones ) b ON c.Requisiciones_idRequisiciones = b.Requisiciones_idRequisiciones AND c.fecha = b.maxDate where direc.idDirecciones = ? order by idRequisiciones desc',[idDireccion]);
    con.end();
    return res.status(200).json(requis[0])
  } catch (error) {
    con.end()
    return res.status(401).json(error) 
  }
}

//Requisiciones para busqueda historial Director
export const showRequiDirectorById = async(req:Request,res:Response):Promise<Response>=>{
  if(!req.body){ res.status(400).json({msg: 'envia toda la informacion'})}
  const con = await connect();
  try {
    const idRequi = req.body.idRequi;
    const toke = req.headers["x-access-token"]?.toString();
    if(!toke) return res.status(403).json({ message: "sin token" })
    const decoded:any = jwt.verify(toke,config.SECRET);
    if(!decoded) return res.status(404).json({ message:' token invalido ' })
    const direccion:any = await con.query('select idDirecciones from usuarios inner join departamentos as dpto on dpto.idDepartamentos = usuarios.Departamentos_idDepartamentos inner join direcciones as direc on direc.idDirecciones = dpto.Direcciones_idDirecciones where usuarios.idUsuarios = ?',[decoded.id]);
    const idDireccion =direccion[0][0]['idDirecciones'];
    const requis = await con.query('SELECT idRequisiciones,fecha,justificacion,requiriente.nombre as NomRequiriente, requiriente.apellido as ApeRequiriente, centrocosto.centroCosto,CCdepartamento.departamento as CCdepartamento, CCdireccion.direccion as CCdireccion,centroCosto,bienesOServicios, requi.estado ,usuario.Departamentos_idDepartamentos,direc.idDirecciones FROM inagua_requis.requisiciones as requi inner join usuarios as requiriente on requiriente.idUsuarios = requi.Usuarios_requiriente inner join usuarios as usuario on usuario.idUsuarios = requi.Usuarios_idUsuarios inner join centrocosto on centrocosto.idCentroCosto = requi.CentroCosto_idCentroCosto inner join departamentos as CCdepartamento on CCdepartamento.idDepartamentos = centrocosto.Departamentos_idDepartamentos inner join direcciones as CCdireccion on CCdireccion.idDirecciones = CCdepartamento.Direcciones_idDirecciones inner join departamentos as dpto on dpto.idDepartamentos = usuario.Departamentos_idDepartamentos inner join direcciones as direc on direc.idDirecciones = dpto.Direcciones_idDirecciones where direc.idDirecciones = ? and requi.idRequisiciones = ? order by idRequisiciones desc',[idDireccion,idRequi]);
    con.end();
    return res.status(200).json(requis[0])
  } catch (error) {
    con.end()
    return res.status(401).json(error) 
    
  }
}

export const finalizarEntrega = async(req:Request,res:Response):Promise<Response>=>{
  if(!req.body || !req.header){
    return res.status(400).json({ msg: 'Envia toda la informacion' })
  }
  let msg= "No pudo ser actualizada"
  let con:any =null;
  const pool = await connect();
  try {
    const toke = req.headers["x-access-token"]?.toString();
    if(!toke) return res.status(403).json({ message: "sin token" })
    const decoded:any = jwt.verify(toke,config.SECRET);
    if(!decoded) return res.status(404).json({ message:' token invalido ' })
    const arr = req.body;
    con = await pool.getConnection();
    const getEstado = await con.query('SELECT estado FROM requisiciones WHERE idRequisiciones = ?',[arr.idRequi]);
    if(getEstado[0][0].estado === 5){
      await con.beginTransaction();
      const update = await con.query('UPDATE requisiciones SET estado = 6 where idRequisiciones = ?',[arr.idRequi]);
      const addHistory = await con.query('INSERT INTO historial(idhistorial,Usuarios_idUsuarios,Requisiciones_idRequisiciones,comentarios,nuevoEstado) values(default,?,?,?,?)',[decoded.id,arr.idRequi,'Requisición Finalizada Satisfactoriamente "Finalizada por Adquisiciones"',6])
      await con.commit();
      msg= "successAD"
      console.log(`FINALIZAR EN ADQUISICIONES: ID Usuario --> ${decoded.id} | REQUISICION: ${arr.idRequi} | Time: ${new Date()}`)

    }
    if(getEstado[0][0].estado === 8){
      await con.beginTransaction();
      const update = await con.query('UPDATE requisiciones SET estado = 9 where idRequisiciones = ?',[arr.idRequi]);
      const addHistory = await con.query('INSERT INTO historial(idhistorial,Usuarios_idUsuarios,Requisiciones_idRequisiciones,comentarios,nuevoEstado) values(default,?,?,?,?)',[decoded.id,arr.idRequi,'Requisición Finalizada Satisfactoriamente "Finalizada por Caja Chica"',9])
      await con.commit();
      msg = "successCC"
      console.log(`FINALIZAR EN CAJA CHICA: ID Usuario --> ${decoded.id} | REQUISICION: ${arr.idRequi} | Time: ${new Date()}`)
    }
    pool.end()
    return res.status(200).json({msg:msg})
  } catch (error) {
    if (con) await con.rollback();
        pool.end();
        return res.send(error)
        throw error;
  }
}

//historial by user (filtro estado)
export const historialByUsuario = async(req:Request,res:Response):Promise<Response>=>{
  if(!req.body || !req.header){ res.status(400).json({msg: 'envia toda la informacion'})}
  const con = await connect();
  try {
    const estado = req.body.Nestado;
    const toke = req.headers["x-access-token"]?.toString();
    if(!toke) return res.status(403).json({ message: "sin token" })
    const decoded:any = jwt.verify(toke,config.SECRET);
    if(!decoded) return res.status(404).json({ message:' token invalido ' })
    const response:any = await con.query('Select * from historial where (Usuarios_idUsuarios = ? and nuevoEstado = ?) order by fecha desc',[decoded.id,estado]);
    con.end();
    return res.status(200).json(response[0])
  } catch (error) {
    con.end()
    return res.status(401).json(error) 
  }
}