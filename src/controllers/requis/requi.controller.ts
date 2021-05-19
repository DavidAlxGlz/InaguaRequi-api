import { connect } from '../../database';
import {Request,Response} from 'express';
import jwt from "jsonwebtoken";
import config from '../../config';



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

        //La requisicion requiere el ID del centro de costo
        const CC:any = await conn.query('SELECT idCentroCosto from centrocosto where centroCosto = ?',[arr.CentroCosto_idCentroCosto]);
        const idCC = CC[0][0].idCentroCosto;
        await conn.beginTransaction();
        const requi:any = await conn.query(`INSERT INTO requisiciones(idRequisiciones,fecha,justificacion,Usuarios_idUsuarios,CentroCosto_idCentroCosto,Directores_idDirectores,bienesOServicios,Usuarios_requiriente,estado,gastoCorriente,recursoPropio,recursoOtros,descOtros) values(default,?,?,?,?,?,?,?,?,?,?,?,?)`,[arr.fecha,arr.justificacion,decoded.id,idCC,arr.Directores_idDirectores,arr.bienesOServicios,arr.Usuarios_requiriente,arr.estado,arr.gastoCorriente,arr.recursoPropio,arr.recursoOtros,arr.descOtros]);

        //cambiar por select para obtener el id de la requi creada
        const idNuevaRequi = requi[0].insertId;
        movimientos.map(async(requi:any,index:number)=>{
         const movi = await conn.query('INSERT INTO movimiento (idMovimiento,descripcion,cantidad,Unidades_idUnidades,Requisiciones_idRequisiciones) values(default,?,?,?,?)',[requi.descripcion,requi.cantidad,requi.unidades,idNuevaRequi]);
       })

       //Añadir al historial el movimiento realizado
       const histo = await conn.query('INSERT INTO historial(idhistorial,Usuarios_idUsuarios,Requisiciones_idRequisiciones,comentarios,nuevoEstado) values(default,?,?,?,?)',[decoded.id,idNuevaRequi,'Nueva Requisición',1]);

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

//edit requi
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
    await conn.beginTransaction();
    const getEstado = await conn.query('SELECT estado FROM inagua_requis.requisiciones where idRequisiciones = ?',[arr.idRequi])
    console.log(getEstado[0][0].estado)
    if(getEstado[0][0].estado === 0 || getEstado[0][0].estado === 1){
      const del = await conn.query('Delete from movimiento where Requisiciones_idRequisiciones = ?',[arr.idRequi]);
      movimientos.map(async(requi:any,index:number)=>{
      const movi = await conn.query('INSERT INTO movimiento (idMovimiento,descripcion,cantidad,Unidades_idUnidades,Requisiciones_idRequisiciones) values(default,?,?,?,?)',[requi.descripcion,requi.cantidad,requi.unidades,arr.idRequi]);
      })
      const estado = await conn.query('UPDATE requisiciones SET estado = 1 where idRequisiciones = ?',[arr.idRequi]);
      const addHistory = await conn.query('INSERT INTO historial(idhistorial,Usuarios_idUsuarios,Requisiciones_idRequisiciones,comentarios,nuevoEstado) values(default,?,?,?,?)',[decoded.id,arr.idRequi,'Requisición editada',1]);
      await conn.commit();
      msg ='Requisición editada con éxito';
    }else{
      msg='No es posible editar esta requisición'
    }
    pool.end()
    return res.status(200).json({msg:msg})
  }catch (error){
    if (conn) await conn.rollback();
    pool.end();
  }

}

//informacion de usuario
export const showHistorialById =async(req:Request,res:Response)=>{
  if(!req.body || !req.header){
    return res.status(400).json({ msg: 'Envia toda la informacion' })
  }
  const arr = req.body;
  let conn:any = null;
  try {
      const toke = req.headers["x-access-token"]?.toString();  
      if(!toke) return res.status(403).json({ message: "sin token" })
      const decoded:any = jwt.verify(toke,config.SECRET);
      if(!decoded) return res.status(404).json({ message:' token invalido '})
      const pool = await connect();
      conn = await pool.getConnection();
      console.log(req.body)
      const hist = await conn.query('select idhistorial,Usuarios_idUsuarios,comentarios,nuevoEstado,fecha,idUsuarios,nombre,apellido from historial join usuarios as usuario on usuario.idUsuarios = historial.Usuarios_idUsuarios where Requisiciones_idRequisiciones = ? order by fecha desc',[arr.idRequi]);
      pool.end()
      return res.status(200).json(hist[0])
    } catch (error) {
      return res.status(401).json({ message: 'no autorizado' }) 
    }
}



//informacion de usuario
export const infoUsuario =async(req:Request,res:Response)=>{
  let conn:any = null;
  try {
      const toke = req.headers["x-access-token"]?.toString();  
      if(!toke) return res.status(403).json({ message: "sin token" })
      const decoded:any = jwt.verify(toke,config.SECRET);
      if(!decoded) return res.status(404).json({ message:' token invalido '})
      const pool = await connect();
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
      return res.status(401).json({ message: 'no autorizado' }) 
    }
}

//Obtener usuarios por departamento
export const solicitantesByUser =async(req:Request,res:Response)=>{
  if(!req.body || !req.header){
    return res.status(400).json({ msg: 'Envia toda la informacion' })
  }
  let conn:any = null;
  const Departamentos_idDepartamentos = req.body.idDepartamentos;
  try {
    const toke = req.headers["x-access-token"]?.toString();  
      if(!toke) return res.status(403).json({ message: "sin token" })
      const decoded:any = jwt.verify(toke,config.SECRET);
      if(!decoded) return res.status(404).json({ message:' token invalido '})
    const pool = await connect();
    conn = await pool.getConnection();
    const response:any = await conn.query('select * from solicitantes inner join usuarios as usuario on usuario.idUsuarios = solicitantes.Usuarios_idUsuarios where solicitantes.Usuario = ?',[decoded.id])
    if(!response){
      return res.status(400).json({msg:'Sin resultados'})
    }
   pool.end()
   res.status(200).json(response[0])
  } catch (error) {
    return res.status(401).json({ message: 'no autorizado' }) 

  }
}



//ver todas las requisiciones presupuesto Solicitudes
export const showRequisPresupuesto =async(req:Request,res:Response):Promise<Response>=>{
  try {
      const conn = await connect();
      const requis = await conn.query('SELECT idRequisiciones,fecha,justificacion,requiriente.nombre as NomRequiriente, requiriente.apellido as ApeRequiriente, centrocosto.centroCosto,CCdepartamento.departamento as CCdepartamento, CCdireccion.direccion as CCdireccion,bienesOServicios,requi.estado,DptoUsuario.departamento FROM inagua_requis.requisiciones as requi inner join usuarios as requiriente on requiriente.idUsuarios = requi.Usuarios_requiriente inner join usuarios as usuario on usuario.idUsuarios = requi.Usuarios_idUsuarios inner join centrocosto on centrocosto.idCentroCosto = requi.CentroCosto_idCentroCosto inner join departamentos as CCdepartamento on CCdepartamento.idDepartamentos = centrocosto.Departamentos_idDepartamentos inner join direcciones as CCdireccion on CCdireccion.idDirecciones = CCdepartamento.Direcciones_idDirecciones inner join departamentos as DptoUsuario on DptoUsuario.idDepartamentos = usuario.Departamentos_idDepartamentos where requi.estado = 1 order by idRequisiciones desc;');
      conn.end()
     return res.status(200).json(requis[0])
    } catch (error) {
      return res.status(401).json({ message: 'no autorizado' }) 
    }
}

//ver todas las requisiciones Rechazadas por usuario
export const showRequisUsuarioRechazadas =async(req:Request,res:Response):Promise<Response>=>{
  try {
    const toke = req.headers["x-access-token"]?.toString();  
      if(!toke) return res.status(403).json({ message: "sin token" })
      const decoded:any = jwt.verify(toke,config.SECRET);
      if(!decoded) return res.status(404).json({ message:' token invalido '})
      const conn = await connect();
      const requis = await conn.query('SELECT idRequisiciones,fecha,justificacion,requiriente.nombre as NomRequiriente, requiriente.apellido as ApeRequiriente, centrocosto.centroCosto,CCdepartamento.departamento as CCdepartamento,CCdireccion.direccion as CCdireccion,centroCosto,bienesOServicios,requi.estado,DptoUsuario.departamento FROM inagua_requis.requisiciones as requi inner join usuarios as requiriente on requiriente.idUsuarios = requi.Usuarios_requiriente inner join usuarios as usuario on usuario.idUsuarios = requi.Usuarios_idUsuarios inner join centrocosto on centrocosto.idCentroCosto = requi.CentroCosto_idCentroCosto inner join departamentos as CCdepartamento on CCdepartamento.idDepartamentos = centrocosto.Departamentos_idDepartamentos inner join direcciones as CCdireccion on CCdireccion.idDirecciones = CCdepartamento.Direcciones_idDirecciones inner join departamentos as DptoUsuario on DptoUsuario.idDepartamentos = usuario.Departamentos_idDepartamentos where requi.estado = 0 and usuario.idUsuarios = ? order by idRequisiciones desc;',[decoded.id]);
      conn.end()
     return res.status(200).json(requis[0])
    } catch (error) {
      return res.status(401).json({ message: 'no autorizado' }) 
    }
}

//ver todas las requisiciones aprobadas
export const showRequisUsuarioAprobadas =async(req:Request,res:Response):Promise<Response>=>{
  try {
    const toke = req.headers["x-access-token"]?.toString();  
      if(!toke) return res.status(403).json({ message: "sin token" })
      const decoded:any = jwt.verify(toke,config.SECRET);
      if(!decoded) return res.status(404).json({ message:' token invalido '})
      const conn = await connect();
      const requis = await conn.query('SELECT idRequisiciones,fecha,justificacion,requiriente.nombre as NomRequiriente, requiriente.apellido as ApeRequiriente, centrocosto.centroCosto,CCdepartamento.departamento as CCdepartamento,CCdireccion.direccion as CCdireccion,centroCosto,bienesOServicios,requi.estado,DptoUsuario.departamento FROM inagua_requis.requisiciones as requi inner join usuarios as requiriente on requiriente.idUsuarios = requi.Usuarios_requiriente inner join usuarios as usuario on usuario.idUsuarios = requi.Usuarios_idUsuarios inner join centrocosto on centrocosto.idCentroCosto = requi.CentroCosto_idCentroCosto inner join departamentos as CCdepartamento on CCdepartamento.idDepartamentos = centrocosto.Departamentos_idDepartamentos inner join direcciones as CCdireccion on CCdireccion.idDirecciones = CCdepartamento.Direcciones_idDirecciones inner join departamentos as DptoUsuario on DptoUsuario.idDepartamentos = usuario.Departamentos_idDepartamentos where requi.estado = 5 and usuario.idUsuarios = ? order by idRequisiciones desc;',[decoded.id]);
      conn.end()
     return res.status(200).json(requis[0])
    } catch (error) {
      return res.status(401).json({ message: 'no autorizado' }) 
    }
}

//para ver el ultimo rechazo de una requisicion en detalles de rechazadas
export const showLastRechazoByIdRequi =async(req:Request,res:Response)=>{
  if(!req.body || !req.header){
    return res.status(400).json({ msg: 'Envia toda la informacion' })
  }
  const arr = req.body;
  let conn:any = null;
  try {
      const toke = req.headers["x-access-token"]?.toString();  
      if(!toke) return res.status(403).json({ message: "sin token" })
      const decoded:any = jwt.verify(toke,config.SECRET);
      if(!decoded) return res.status(404).json({ message:' token invalido '})
      const pool = await connect();
      conn = await pool.getConnection();
      console.log(req.body)
      const hist = await conn.query('select * from historial where Requisiciones_idRequisiciones = ? and nuevoEstado = 0 order by fecha desc limit 1',[arr.idRequi]);
      pool.end()
      return res.status(200).json(hist[0])
    } catch (error) {
      return res.status(401).json({ message: 'no autorizado' }) 
    }
}


//ver todas las requisiciones adquisiciones Solicitudes
export const showRequisAdquisiciones =async(req:Request,res:Response):Promise<Response>=>{
  try {
      const conn = await connect();
      const requis = await conn.query('SELECT idRequisiciones,fecha,justificacion,requiriente.nombre as NomRequiriente, requiriente.apellido as ApeRequiriente, centrocosto.centroCosto,CCdepartamento.departamento as CCdepartamento, CCdireccion.direccion as CCdireccion,centroCosto,bienesOServicios,requi.estado,DptoUsuario.departamento FROM inagua_requis.requisiciones as requi inner join usuarios as requiriente on requiriente.idUsuarios = requi.Usuarios_requiriente inner join usuarios as usuario on usuario.idUsuarios = requi.Usuarios_idUsuarios inner join centrocosto on centrocosto.idCentroCosto = requi.CentroCosto_idCentroCosto inner join departamentos as CCdepartamento on CCdepartamento.idDepartamentos = centrocosto.Departamentos_idDepartamentos inner join direcciones as CCdireccion on CCdireccion.idDirecciones = CCdepartamento.Direcciones_idDirecciones inner join departamentos as DptoUsuario on DptoUsuario.idDepartamentos = usuario.Departamentos_idDepartamentos where requi.estado = 3 order by idRequisiciones desc;');
      conn.end()
     return res.status(200).json(requis[0])
    } catch (error) {
      return res.status(401).json({ message: 'no autorizado' }) 
    }
}

//ver todas las requisiciones presupuesto para aprobar
export const showRequisPresupuestoAprobacion =async(req:Request,res:Response):Promise<Response>=>{
  try {
      const conn = await connect();
      const requis = await conn.query('SELECT idRequisiciones,fecha,justificacion,requiriente.nombre as NomRequiriente, requiriente.apellido as ApeRequiriente, centrocosto.centroCosto,CCdepartamento.departamento as CCdepartamento, CCdireccion.direccion as CCdireccion,centroCosto,bienesOServicios,requi.estado,DptoUsuario.departamento FROM inagua_requis.requisiciones as requi inner join usuarios as requiriente on requiriente.idUsuarios = requi.Usuarios_requiriente inner join usuarios as usuario on usuario.idUsuarios = requi.Usuarios_idUsuarios inner join centrocosto on centrocosto.idCentroCosto = requi.CentroCosto_idCentroCosto inner join departamentos as CCdepartamento on CCdepartamento.idDepartamentos = centrocosto.Departamentos_idDepartamentos inner join direcciones as CCdireccion on CCdireccion.idDirecciones = CCdepartamento.Direcciones_idDirecciones inner join departamentos as DptoUsuario on DptoUsuario.idDepartamentos = usuario.Departamentos_idDepartamentos where requi.estado = 2 order by idRequisiciones desc;');
      conn.end()
     return res.status(200).json(requis[0])
    } catch (error) {
      return res.status(401).json({ message: 'no autorizado' }) 
    }
}

//ver todas las requisiciones Adquisiciones para aprobar
export const showRequisAdquisicionesAprobacion =async(req:Request,res:Response):Promise<Response>=>{
  try {
      const conn = await connect();
      const requis = await conn.query('SELECT idRequisiciones,fecha,justificacion,requiriente.nombre as NomRequiriente, requiriente.apellido as ApeRequiriente, centrocosto.centroCosto,CCdepartamento.departamento as CCdepartamento, CCdireccion.direccion as CCdireccion,centroCosto,bienesOServicios,requi.estado,DptoUsuario.departamento FROM inagua_requis.requisiciones as requi inner join usuarios as requiriente on requiriente.idUsuarios = requi.Usuarios_requiriente inner join usuarios as usuario on usuario.idUsuarios = requi.Usuarios_idUsuarios inner join centrocosto on centrocosto.idCentroCosto = requi.CentroCosto_idCentroCosto inner join departamentos as CCdepartamento on CCdepartamento.idDepartamentos = centrocosto.Departamentos_idDepartamentos inner join direcciones as CCdireccion on CCdireccion.idDirecciones = CCdepartamento.Direcciones_idDirecciones inner join departamentos as DptoUsuario on DptoUsuario.idDepartamentos = usuario.Departamentos_idDepartamentos where requi.estado = 4 order by idRequisiciones desc;');
      conn.end()
     return res.status(200).json(requis[0])
    } catch (error) {
      return res.status(401).json({ message: 'no autorizado' }) 
    }
}

//Recibir hoja en presupuesto
export const recibirhojaPresupuesto = async(req:Request,res:Response):Promise<Response>=>{
  if(!req.body || !req.header){
    return res.status(400).json({ msg: 'Envia toda la informacion' })
}
console.log(req.body.idRequi)
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
    const update = await con.query('UPDATE requisiciones SET estado = 2 where idRequisiciones = ?',[arr.idRequi]);
    const addHistory = await con.query('INSERT INTO historial(idhistorial,Usuarios_idUsuarios,Requisiciones_idRequisiciones,comentarios,nuevoEstado) values(default,?,?,?,?)',[decoded.id,arr.idRequi,'Hoja recibida en presupuesto',2])
    await con.commit();
    pool.end()
    return res.status(200).json({msg:'actualizado'})
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
console.log(req.body.idRequi)
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
    const update = await con.query('UPDATE requisiciones SET estado = 4 where idRequisiciones = ?',[arr.idRequi]);
    const addHistory = await con.query('INSERT INTO historial(idhistorial,Usuarios_idUsuarios,Requisiciones_idRequisiciones,comentarios,nuevoEstado) values(default,?,?,?,?)',[decoded.id,arr.idRequi,'Hoja recibida en Adquisiciones',4])
    await con.commit();
    pool.end()
    return res.status(200).json({msg:'actualizado'})
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
console.log(req.body)
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
    const update = await con.query('UPDATE requisiciones SET estado = 3 where idRequisiciones = ?',[arr.idRequi]);
    const addHistory = await con.query('INSERT INTO historial(idhistorial,Usuarios_idUsuarios,Requisiciones_idRequisiciones,comentarios,nuevoEstado) values(default,?,?,?,?)',[decoded.id,arr.idRequi,'Aprobada por presupuesto',3])
    await con.commit();
    pool.end()
    return res.status(200).json({msg:'actualizado'})
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
console.log(req.body)
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
    const update = await con.query('UPDATE requisiciones SET estado = 5 where idRequisiciones = ?',[arr.idRequi]);
    const addHistory = await con.query('INSERT INTO historial(idhistorial,Usuarios_idUsuarios,Requisiciones_idRequisiciones,comentarios,nuevoEstado) values(default,?,?,?,?)',[decoded.id,arr.idRequi,'Aprobada por Adquisiciones',5])
    await con.commit();
    pool.end()
    return res.status(200).json({msg:'actualizado'})
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
console.log(req.body)
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
    const update = await con.query('UPDATE requisiciones SET estado = 0 where idRequisiciones = ?',[arr.idRequi]);
    const addHistory = await con.query('INSERT INTO historial(idhistorial,Usuarios_idUsuarios,Requisiciones_idRequisiciones,comentarios,nuevoEstado) values(default,?,?,?,?)',[decoded.id,arr.idRequi,arr.msgRechazo,0])
    await con.commit();
    pool.end()
    return res.status(200).json({msg:'actualizado'})
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
console.log(req.body)
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
    const update = await con.query('UPDATE requisiciones SET estado = 0 where idRequisiciones = ?',[arr.idRequi]);
    const addHistory = await con.query('INSERT INTO historial(idhistorial,Usuarios_idUsuarios,Requisiciones_idRequisiciones,comentarios,nuevoEstado) values(default,?,?,?,?)',[decoded.id,arr.idRequi,arr.msgRechazo,0])
    await con.commit();
    pool.end()
    return res.status(200).json({msg:'actualizado'})
  } catch (error) {
    if (con) await con.rollback();
        pool.end();
        return res.send(error)
        throw error;
  }
}


//ver todas las requisiciones de un usuario
export const showRequisByUser =async(req:Request,res:Response):Promise<Response>=>{
  try {
    const toke = req.headers["x-access-token"]?.toString();
    if(!toke) return res.status(403).json({ message: "sin token" })
    const decoded:any = jwt.verify(toke,config.SECRET);
    if(!decoded) return res.status(404).json({ message:' token invalido ' })
    const conn = await connect();
    const requis = await conn.query('SELECT idRequisiciones,fecha,justificacion,requiriente.nombre as NomRequiriente, requiriente.apellido as ApeRequiriente, centrocosto.centroCosto,CCdepartamento.departamento as CCdepartamento, CCdireccion.direccion as CCdireccion,centroCosto,bienesOServicios, requi.estado FROM inagua_requis.requisiciones as requi inner join usuarios as requiriente on requiriente.idUsuarios = requi.Usuarios_requiriente inner join usuarios as usuario on usuario.idUsuarios = requi.Usuarios_idUsuarios inner join centrocosto on centrocosto.idCentroCosto = requi.CentroCosto_idCentroCosto inner join departamentos as CCdepartamento on CCdepartamento.idDepartamentos = centrocosto.Departamentos_idDepartamentos inner join direcciones as CCdireccion on CCdireccion.idDirecciones = CCdepartamento.Direcciones_idDirecciones where usuario.idUsuarios = ? order by idRequisiciones desc;',[decoded.id])
    conn.end()
    return res.status(200).json(requis[0])
  } catch (error) {
    return res.status(401).json(error)
  }
} 

//Requisición por id usuario e id requisicion (buscador)
export const findUserRequiById =async(req:Request,res:Response):Promise<Response>=>{
  try {
    const toke = req.headers["x-access-token"]?.toString();
    if(!toke) return res.status(403).json({ message: "sin token" })
    const decoded:any = jwt.verify(toke,config.SECRET);
    if(!decoded) return res.status(404).json({ message:' token invalido ' })
    const idRequi = req.body.idRequi;
    const conn = await connect();
    const requis:any = await conn.query('SELECT idRequisiciones,fecha,justificacion,requiriente.nombre as NomRequiriente, requiriente.apellido as ApeRequiriente, centrocosto.centroCosto,CCdepartamento.departamento as CCdepartamento, CCdireccion.direccion as CCdireccion,centroCosto,bienesOServicios,requi.estado FROM inagua_requis.requisiciones as requi inner join usuarios as requiriente on requiriente.idUsuarios = requi.Usuarios_requiriente inner join usuarios as usuario on usuario.idUsuarios = requi.Usuarios_idUsuarios inner join centrocosto on centrocosto.idCentroCosto = requi.CentroCosto_idCentroCosto inner join departamentos as CCdepartamento on CCdepartamento.idDepartamentos = centrocosto.Departamentos_idDepartamentos inner join direcciones as CCdireccion on CCdireccion.idDirecciones = CCdepartamento.Direcciones_idDirecciones where usuario.idUsuarios = ? and requi.idRequisiciones = ? order by idRequisiciones desc;',[decoded.id,idRequi]);
    return res.status(200).json(requis[0]);
  } catch (error) {
    return res.status(401).json(error);
  }
}

//Requisición por id usuario e id requisicion (buscador) Aprobadas
export const findUserRequiByIdAprobadas =async(req:Request,res:Response):Promise<Response>=>{
  try {
    const toke = req.headers["x-access-token"]?.toString();
    if(!toke) return res.status(403).json({ message: "sin token" })
    const decoded:any = jwt.verify(toke,config.SECRET);
    if(!decoded) return res.status(404).json({ message:' token invalido ' })
    const idRequi = req.body.idRequi;
    const conn = await connect();
    const requis:any = await conn.query('SELECT idRequisiciones,fecha,justificacion,requiriente.nombre as NomRequiriente, requiriente.apellido as ApeRequiriente, centrocosto.centroCosto,CCdepartamento.departamento as CCdepartamento, CCdireccion.direccion as CCdireccion,centroCosto,bienesOServicios,requi.estado FROM inagua_requis.requisiciones as requi inner join usuarios as requiriente on requiriente.idUsuarios = requi.Usuarios_requiriente inner join usuarios as usuario on usuario.idUsuarios = requi.Usuarios_idUsuarios inner join centrocosto on centrocosto.idCentroCosto = requi.CentroCosto_idCentroCosto inner join departamentos as CCdepartamento on CCdepartamento.idDepartamentos = centrocosto.Departamentos_idDepartamentos inner join direcciones as CCdireccion on CCdireccion.idDirecciones = CCdepartamento.Direcciones_idDirecciones where usuario.idUsuarios = ? and requi.idRequisiciones = ? and requi.estado = 5 order by idRequisiciones desc;',[decoded.id,idRequi]);
    return res.status(200).json(requis[0]);
  } catch (error) {
    return res.status(401).json(error);
  }
}

//ver todas las requisiciones del departamento segun usuario
export const showRequisByDepartamentoUsuario =async(req:Request,res:Response):Promise<Response>=>{
  try {
    const toke = req.headers["x-access-token"]?.toString();
    if(!toke) return res.status(403).json({ message: "sin token" })
    const decoded:any = jwt.verify(toke,config.SECRET);
    if(!decoded) return res.status(404).json({ message:' token invalido ' })
    const conn = await connect();
    const requis = await conn.query('SELECT idRequisiciones,fecha,justificacion,nombre,apellido,departamento,direccion,centroCosto,bienesOServicios  FROM inagua_requis.requisiciones inner join usuarios on usuarios.idUsuarios = requisiciones.Usuarios_idUsuarios inner join centrocosto on centroCosto.idCentroCosto = requisiciones.CentroCosto_idCentroCosto inner join departamentos on departamentos.idDepartamentos = centroCosto.Departamentos_idDepartamentos inner join direcciones on direcciones.idDirecciones = centroCosto.Direcciones_idDirecciones where departamentos.idDepartamentos in (select  Departamentos_idDepartamentos from usuarios inner join centrocosto on centroCosto.idCentroCosto = usuarios.CentroCosto_idCentroCosto where usuarios.idUsuarios = ?) order by idRequisiciones desc;',[decoded.id])
    conn.end()
    return res.status(200).json(requis[0])
  } catch (error) {
    return res.status(401).json(error)
  }
} 

//ver una sola requisicion por id ( presupuesto )
export const showRequiByIdPresupuestoAprobaciones =async(req:Request,res:Response):Promise<Response>=>{
  if(!req.body){ res.status(400).json({msg: 'envia toda la informacion'})}
  const idRequi = req.body.idRequi;
  try {
    const conn = await connect();
    const requi = await conn.query('Select requi.idRequisiciones,requi.fecha,requi.justificacion,requiriente.nombre as NomRequiriente,bienesOServicios, requiriente.apellido as ApeRequiriente, centrocosto.centroCosto,CCdepartamento.departamento as CCdepartamento, CCdireccion.direccion as CCdireccion,director.nombre as NomDirector, director.apellido as ApeDirector from requisiciones as requi inner join usuarios as requiriente on requiriente.idUsuarios = requi.Usuarios_requiriente inner join usuarios as usuario on usuario.idUsuarios = requi.Usuarios_idUsuarios inner join centrocosto on centrocosto.idCentroCosto = requi.CentroCosto_idCentroCosto inner join departamentos as CCdepartamento on CCdepartamento.idDepartamentos = centrocosto.Departamentos_idDepartamentos inner join direcciones as CCdireccion on CCdireccion.idDirecciones = CCdepartamento.Direcciones_idDirecciones inner join directores as director on director.idDirectores = requi.Directores_idDirectores where requi.idRequisiciones = ? and estado = 2',[idRequi]);
    conn.end()
   return res.status(200).json(requi[0])
  } catch (error) {
    return res.status(401).json(error) 
  }
}

//ver una sola requisicion por id ( Adquisiciones )
export const showRequiByIdAdquisicionesAprobaciones =async(req:Request,res:Response):Promise<Response>=>{
  if(!req.body){ res.status(400).json({msg: 'envia toda la informacion'})}
  const idRequi = req.body.idRequi;
  try {
    const conn = await connect();
    const requi = await conn.query('Select requi.idRequisiciones,requi.fecha,requi.justificacion,requiriente.nombre as NomRequiriente,bienesOServicios, requiriente.apellido as ApeRequiriente, centrocosto.centroCosto,CCdepartamento.departamento as CCdepartamento, CCdireccion.direccion as CCdireccion,director.nombre as NomDirector, director.apellido as ApeDirector from requisiciones as requi inner join usuarios as requiriente on requiriente.idUsuarios = requi.Usuarios_requiriente inner join usuarios as usuario on usuario.idUsuarios = requi.Usuarios_idUsuarios inner join centrocosto on centrocosto.idCentroCosto = requi.CentroCosto_idCentroCosto inner join departamentos as CCdepartamento on CCdepartamento.idDepartamentos = centrocosto.Departamentos_idDepartamentos inner join direcciones as CCdireccion on CCdireccion.idDirecciones = CCdepartamento.Direcciones_idDirecciones inner join directores as director on director.idDirectores = requi.Directores_idDirectores where requi.idRequisiciones = ? and estado = 4',[idRequi]);
    conn.end()
   return res.status(200).json(requi[0])
  } catch (error) {
    return res.status(401).json(error) 
  }
}

//ver una sola requisicion por id ( presupuesto )
export const showRequiByIdPresupuesto =async(req:Request,res:Response):Promise<Response>=>{
  if(!req.body){ res.status(400).json({msg: 'envia toda la informacion'})}
  const idRequi = req.body.idRequi;
  try {
    const conn = await connect();
    const requi = await conn.query('Select requi.idRequisiciones,requi.fecha,requi.justificacion,requiriente.nombre as NomRequiriente,bienesOServicios, requiriente.apellido as ApeRequiriente, centrocosto.centroCosto,CCdepartamento.departamento as CCdepartamento, CCdireccion.direccion as CCdireccion,director.nombre as NomDirector, director.apellido as ApeDirector from requisiciones as requi inner join usuarios as requiriente on requiriente.idUsuarios = requi.Usuarios_requiriente inner join usuarios as usuario on usuario.idUsuarios = requi.Usuarios_idUsuarios inner join centrocosto on centrocosto.idCentroCosto = requi.CentroCosto_idCentroCosto inner join departamentos as CCdepartamento on CCdepartamento.idDepartamentos = centrocosto.Departamentos_idDepartamentos inner join direcciones as CCdireccion on CCdireccion.idDirecciones = CCdepartamento.Direcciones_idDirecciones inner join directores as director on director.idDirectores = requi.Directores_idDirectores where requi.idRequisiciones = ? and estado = 1',[idRequi]);
    conn.end()
   return res.status(200).json(requi[0])
  } catch (error) {
    return res.status(401).json(error) 
  }
}

//ver una sola requisicion por id ( historial )
export const showRequiByIdHistorial =async(req:Request,res:Response):Promise<Response>=>{
  if(!req.body){ res.status(400).json({msg: 'envia toda la informacion'})}
  const idRequi = req.body.idRequi;
  try {
    const conn = await connect();
    const requi = await conn.query('Select requi.idRequisiciones,requi.fecha,requi.justificacion,requiriente.nombre as NomRequiriente,bienesOServicios, requiriente.apellido as ApeRequiriente, centrocosto.centroCosto,CCdepartamento.departamento as CCdepartamento, CCdireccion.direccion as CCdireccion,director.nombre as NomDirector, director.apellido as ApeDirector from requisiciones as requi inner join usuarios as requiriente on requiriente.idUsuarios = requi.Usuarios_requiriente inner join usuarios as usuario on usuario.idUsuarios = requi.Usuarios_idUsuarios inner join centrocosto on centrocosto.idCentroCosto = requi.CentroCosto_idCentroCosto inner join departamentos as CCdepartamento on CCdepartamento.idDepartamentos = centrocosto.Departamentos_idDepartamentos inner join direcciones as CCdireccion on CCdireccion.idDirecciones = CCdepartamento.Direcciones_idDirecciones inner join directores as director on director.idDirectores = requi.Directores_idDirectores where requi.idRequisiciones = ?',[idRequi]);
    conn.end()
   return res.status(200).json(requi[0])
  } catch (error) {
    return res.status(401).json(error) 
  }
}

//ver una sola requisicion por id ( Adquisiciones )
export const showRequiByIdAdquisiciones =async(req:Request,res:Response):Promise<Response>=>{
  if(!req.body){ res.status(400).json({msg: 'envia toda la informacion'})}
  const idRequi = req.body.idRequi;
  try {
    const conn = await connect();
    const requi = await conn.query('Select requi.idRequisiciones,requi.fecha,requi.justificacion,requiriente.nombre as NomRequiriente,bienesOServicios, requiriente.apellido as ApeRequiriente, centrocosto.centroCosto,CCdepartamento.departamento as CCdepartamento, CCdireccion.direccion as CCdireccion,director.nombre as NomDirector, director.apellido as ApeDirector,requi.estado from requisiciones as requi inner join usuarios as requiriente on requiriente.idUsuarios = requi.Usuarios_requiriente inner join usuarios as usuario on usuario.idUsuarios = requi.Usuarios_idUsuarios inner join centrocosto on centrocosto.idCentroCosto = requi.CentroCosto_idCentroCosto inner join departamentos as CCdepartamento on CCdepartamento.idDepartamentos = centrocosto.Departamentos_idDepartamentos inner join direcciones as CCdireccion on CCdireccion.idDirecciones = CCdepartamento.Direcciones_idDirecciones inner join directores as director on director.idDirectores = requi.Directores_idDirectores where requi.idRequisiciones = ? and estado = 3',[idRequi]);
    conn.end()
   return res.status(200).json(requi[0])
  } catch (error) {
    return res.status(401).json(error) 
  }
}

//ver una sola requisicion por id ( presupuesto Details)
export const showRequiByIdDetailsPresupuesto =async(req:Request,res:Response):Promise<Response>=>{
  if(!req.body){ res.status(400).json({msg: 'envia toda la informacion'})}
  const idRequi = req.body.idRequi;
  try {
    const conn = await connect();
    const requi = await conn.query('Select requi.idRequisiciones,requi.fecha,requi.justificacion,requiriente.nombre as NomRequiriente, requiriente.apellido as ApeRequiriente, centrocosto.centroCosto,CCdepartamento.departamento as CCdepartamento, CCdireccion.direccion as CCdireccion,director.nombre as NomDirector, director.apellido as ApeDirector,requi.gastoCorriente, requi.recursoPropio, requi.recursoOtros,requi.descOtros from requisiciones as requi inner join usuarios as requiriente on requiriente.idUsuarios = requi.Usuarios_requiriente inner join usuarios as usuario on usuario.idUsuarios = requi.Usuarios_idUsuarios inner join centrocosto on centrocosto.idCentroCosto = requi.CentroCosto_idCentroCosto inner join departamentos as CCdepartamento on CCdepartamento.idDepartamentos = centrocosto.Departamentos_idDepartamentos inner join direcciones as CCdireccion on CCdireccion.idDirecciones = CCdepartamento.Direcciones_idDirecciones inner join directores as director on director.idDirectores = requi.Directores_idDirectores where requi.idRequisiciones = ?',[idRequi]);
    conn.end()
   return res.status(200).json(requi[0])
  } catch (error) {
    return res.status(401).json(error) 
  }
}

export const showRequiByIdDetailsUsuario =async(req:Request,res:Response):Promise<Response>=>{
  if(!req.body){ res.status(400).json({msg: 'envia toda la informacion'})}
  const idRequi = req.body.idRequi;
  console.log('si entra')
  try {
    const conn = await connect();
    const requi = await conn.query('Select requi.idRequisiciones,requi.fecha,requi.justificacion,requiriente.nombre as NomRequiriente, requiriente.apellido as ApeRequiriente, centrocosto.centroCosto,CCdepartamento.departamento as CCdepartamento, CCdireccion.direccion as CCdireccion,director.nombre as NomDirector, director.apellido as ApeDirector,requi.gastoCorriente, requi.recursoPropio, requi.recursoOtros,requi.descOtros, requi.estado, requi.bienesOServicios from requisiciones as requi inner join usuarios as requiriente on requiriente.idUsuarios = requi.Usuarios_requiriente inner join usuarios as usuario on usuario.idUsuarios = requi.Usuarios_idUsuarios inner join centrocosto on centrocosto.idCentroCosto = requi.CentroCosto_idCentroCosto inner join departamentos as CCdepartamento on CCdepartamento.idDepartamentos = centrocosto.Departamentos_idDepartamentos inner join direcciones as CCdireccion on CCdireccion.idDirecciones = CCdepartamento.Direcciones_idDirecciones inner join directores as director on director.idDirectores = requi.Directores_idDirectores where requi.idRequisiciones = ?',[idRequi]);
    conn.end()
   return res.status(200).json(requi[0])
  } catch (error) {
    return res.status(401).json(error) 
  }
}


//movimientos por id requisicion
export const showMovimientosById = async(req:Request,res:Response):Promise<Response>=>{
  if(!req.body){ res.status(400).json({msg: 'envia toda la informacion'})}
  const idRequi = req.body.idRequi;
  try {
    const con = await connect();
    const movs:any = await con.query('SELECT idMovimiento,descripcion,cantidad,Unidades_idUnidades from movimiento where Requisiciones_idRequisiciones = ?',[idRequi]);
    con.end();
    if(movs[0].length === 0){return res.status(204).json('')}
    return res.status(200).json(movs[0])
  } catch (error) {
    return res.status(401).json(error) 
  }
}

//movimientos por id requisicion to edit
export const showMovimientosByIdEdit = async(req:Request,res:Response):Promise<Response>=>{
  if(!req.body){ res.status(400).json({msg: 'envia toda la informacion'})}
  const idRequi = req.body.idRequi;
  try {
    const con = await connect();
    const movs:any = await con.query('SELECT idMovimiento,descripcion,cantidad,Unidades_idUnidades as unidades from movimiento where Requisiciones_idRequisiciones = ?',[idRequi]);
    con.end();
    if(movs[0].length === 0){return res.status(204).json('')}
    return res.status(200).json(movs[0])
  } catch (error) {
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
export const showAllRequis = async(req:Request,res:Response):Promise<Response>=>{
  try {
    const con = await connect();
    const requis = await con.query('SELECT idRequisiciones,fecha,justificacion,requiriente.nombre as NomRequiriente, requiriente.apellido as ApeRequiriente, centrocosto.centroCosto,CCdepartamento.departamento as CCdepartamento, CCdireccion.direccion as CCdireccion,centroCosto,bienesOServicios, requi.estado FROM inagua_requis.requisiciones as requi inner join usuarios as requiriente on requiriente.idUsuarios = requi.Usuarios_requiriente inner join usuarios as usuario on usuario.idUsuarios = requi.Usuarios_idUsuarios inner join centrocosto on centrocosto.idCentroCosto = requi.CentroCosto_idCentroCosto inner join departamentos as CCdepartamento on CCdepartamento.idDepartamentos = centrocosto.Departamentos_idDepartamentos inner join direcciones as CCdireccion on CCdireccion.idDirecciones = CCdepartamento.Direcciones_idDirecciones order by idRequisiciones desc;');
    con.end();
    return res.status(200).json(requis[0])
  } catch (error) {
    return res.status(401).json(error) 
  }
}

//Requisiciones para historial Director
export const showRequisDirector = async(req:Request,res:Response):Promise<Response>=>{
  try {
    const toke = req.headers["x-access-token"]?.toString();
    if(!toke) return res.status(403).json({ message: "sin token" })
    const decoded:any = jwt.verify(toke,config.SECRET);
    if(!decoded) return res.status(404).json({ message:' token invalido ' })
    const con = await connect();
    const direccion:any = await con.query('select idDirecciones from usuarios inner join departamentos as dpto on dpto.idDepartamentos = usuarios.Departamentos_idDepartamentos inner join direcciones as direc on direc.idDirecciones = dpto.Direcciones_idDirecciones where usuarios.idUsuarios = ?',[decoded.id]);
    const idDireccion =direccion[0][0]['idDirecciones'];
    const requis = await con.query('SELECT idRequisiciones,fecha,justificacion,requiriente.nombre as NomRequiriente, requiriente.apellido as ApeRequiriente, centrocosto.centroCosto,CCdepartamento.departamento as CCdepartamento, CCdireccion.direccion as CCdireccion,centroCosto,bienesOServicios, requi.estado ,usuario.Departamentos_idDepartamentos,direc.idDirecciones FROM inagua_requis.requisiciones as requi inner join usuarios as requiriente on requiriente.idUsuarios = requi.Usuarios_requiriente inner join usuarios as usuario on usuario.idUsuarios = requi.Usuarios_idUsuarios inner join centrocosto on centrocosto.idCentroCosto = requi.CentroCosto_idCentroCosto inner join departamentos as CCdepartamento on CCdepartamento.idDepartamentos = centrocosto.Departamentos_idDepartamentos inner join direcciones as CCdireccion on CCdireccion.idDirecciones = CCdepartamento.Direcciones_idDirecciones inner join departamentos as dpto on dpto.idDepartamentos = usuario.Departamentos_idDepartamentos inner join direcciones as direc on direc.idDirecciones = dpto.Direcciones_idDirecciones where direc.idDirecciones = ? order by idRequisiciones desc',[idDireccion]);
    con.end();
    return res.status(200).json(requis[0])
  } catch (error) {
    return res.status(401).json(error) 
  }
}

//Requisiciones para busqueda historial Director
export const showRequiDirectorById = async(req:Request,res:Response):Promise<Response>=>{
  if(!req.body){ res.status(400).json({msg: 'envia toda la informacion'})}
  try {
    const idRequi = req.body.idRequi;
    const toke = req.headers["x-access-token"]?.toString();
    if(!toke) return res.status(403).json({ message: "sin token" })
    const decoded:any = jwt.verify(toke,config.SECRET);
    if(!decoded) return res.status(404).json({ message:' token invalido ' })
    const con = await connect();
    const direccion:any = await con.query('select idDirecciones from usuarios inner join departamentos as dpto on dpto.idDepartamentos = usuarios.Departamentos_idDepartamentos inner join direcciones as direc on direc.idDirecciones = dpto.Direcciones_idDirecciones where usuarios.idUsuarios = ?',[decoded.id]);
    const idDireccion =direccion[0][0]['idDirecciones'];
    const requis = await con.query('SELECT idRequisiciones,fecha,justificacion,requiriente.nombre as NomRequiriente, requiriente.apellido as ApeRequiriente, centrocosto.centroCosto,CCdepartamento.departamento as CCdepartamento, CCdireccion.direccion as CCdireccion,centroCosto,bienesOServicios, requi.estado ,usuario.Departamentos_idDepartamentos,direc.idDirecciones FROM inagua_requis.requisiciones as requi inner join usuarios as requiriente on requiriente.idUsuarios = requi.Usuarios_requiriente inner join usuarios as usuario on usuario.idUsuarios = requi.Usuarios_idUsuarios inner join centrocosto on centrocosto.idCentroCosto = requi.CentroCosto_idCentroCosto inner join departamentos as CCdepartamento on CCdepartamento.idDepartamentos = centrocosto.Departamentos_idDepartamentos inner join direcciones as CCdireccion on CCdireccion.idDirecciones = CCdepartamento.Direcciones_idDirecciones inner join departamentos as dpto on dpto.idDepartamentos = usuario.Departamentos_idDepartamentos inner join direcciones as direc on direc.idDirecciones = dpto.Direcciones_idDirecciones where direc.idDirecciones = ? and requi.idRequisiciones = ? order by idRequisiciones desc',[idDireccion,idRequi]);
    con.end();
    return res.status(200).json(requis[0])
  } catch (error) {
    return res.status(401).json(error) 
    
  }
}

export const finalizarEntrega = async(req:Request,res:Response):Promise<Response>=>{
  if(!req.body || !req.header){
    return res.status(400).json({ msg: 'Envia toda la informacion' })
}
console.log(req.body.idRequi)
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
    const update = await con.query('UPDATE requisiciones SET estado = 6 where idRequisiciones = ?',[arr.idRequi]);
    const addHistory = await con.query('INSERT INTO historial(idhistorial,Usuarios_idUsuarios,Requisiciones_idRequisiciones,comentarios,nuevoEstado) values(default,?,?,?,?)',[decoded.id,arr.idRequi,'Requisición Finalizada Satisfactoriamente',6])
    await con.commit();
    pool.end()
    return res.status(200).json({msg:'actualizado'})
  } catch (error) {
    if (con) await con.rollback();
        pool.end();
        return res.send(error)
        throw error;
  }
}