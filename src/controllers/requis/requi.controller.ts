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
        const requi:any = await conn.query(`INSERT INTO requisiciones(idRequisiciones,fecha,justificacion,Usuarios_idUsuarios,CentroCosto_idCentroCosto) values(default,?,?,?,?)`,[arr.fecha,arr.justificacion,decoded.id,idCC]);
        const idNuevaRequi = requi[0].insertId;
       movimientos.map(async(requi:any,index:number)=>{
         const movi = await conn.query('INSERT INTO movimiento (idMovimiento,descripcion,cantidad,Unidades_idUnidades) values(default,?,?,?)',[requi.descripcion,requi.cantidad,requi.unidades]);
         const idMov = movi[0].insertId;
         await conn.query('INSERT INTO movimiento_has_requisiciones (Movimiento_idMovimiento,Requisiciones_idRequisiciones) values(?,?)',[idMov,idNuevaRequi]);
       })
        await conn.commit();
        pool.end()
        return res.status(200).json(requi)
      } catch (error) {
        if (conn) await conn.rollback();
        pool.end();
        return res.send(error)
        throw error;
      } 
}

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
      const UserSelect:any = await conn.query('SELECT idUsuarios,nombre,apellido,Roles_idRoles,rol,centroCosto,departamentos.departamento,direcciones.direccion FROM usuarios INNER JOIN centrocosto ON usuarios.CentroCosto_idCentroCosto = centrocosto.idCentroCosto INNER JOIN roles ON usuarios.Roles_idroles = roles.idroles INNER JOIN direcciones ON direcciones.idDirecciones = centroCosto.Direcciones_idDirecciones INNER JOIN departamentos ON departamentos.idDepartamentos = centroCosto.Departamentos_idDepartamentos WHERE usuarios.idUsuarios = ?;',[idUsuario])
      if(!UserSelect){
         return res.status(400).json({msg:'el usuario no existe'})
      }
      const {idusuarios,nombre,apellido,centroCosto,rol,departamento,direccion} = UserSelect[0][0];
      pool.end()
      res.status(200).json({idusuarios,nombre,apellido,centroCosto,rol,departamento,direccion})
    } catch (error) {
      return res.status(401).json({ message: 'no autorizado' }) 
    }
}



export const showRequis =async(req:Request,res:Response):Promise<Response>=>{
  try {
      const conn = await connect();
      const requis = await conn.query('SELECT idRequisiciones,fecha,justificacion,nombre,apellido,departamento,direccion,centroCosto FROM inagua_requis.requisiciones inner join usuarios on usuarios.idUsuarios = requisiciones.Usuarios_idUsuarios inner join centrocosto on centroCosto.idCentroCosto = requisiciones.CentroCosto_idCentroCosto inner join departamentos on departamentos.idDepartamentos = centroCosto.Departamentos_idDepartamentos inner join direcciones on direcciones.idDirecciones = centroCosto.Direcciones_idDirecciones order by idRequisiciones desc;');
      conn.end()
     return res.status(200).json(requis[0])
    } catch (error) {
      return res.status(401).json({ message: 'no autorizado' }) 
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
    const requis = await conn.query('SELECT idRequisiciones,fecha,justificacion,nombre,apellido,departamento,direccion,centroCosto FROM inagua_requis.requisiciones inner join usuarios on usuarios.idUsuarios = requisiciones.Usuarios_idUsuarios inner join centrocosto on centroCosto.idCentroCosto = requisiciones.CentroCosto_idCentroCosto inner join departamentos on departamentos.idDepartamentos = centroCosto.Departamentos_idDepartamentos inner join direcciones on direcciones.idDirecciones = centroCosto.Direcciones_idDirecciones where usuarios.idUsuarios = ? order by idRequisiciones desc;',[decoded.id])
    conn.end()
    return res.status(200).json(requis[0])
  } catch (error) {
    return res.status(401).json(error)
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
    const requis = await conn.query('SELECT idRequisiciones,fecha,justificacion,nombre,apellido,departamento,direccion,centroCosto  FROM inagua_requis.requisiciones inner join usuarios on usuarios.idUsuarios = requisiciones.Usuarios_idUsuarios inner join centrocosto on centroCosto.idCentroCosto = requisiciones.CentroCosto_idCentroCosto inner join departamentos on departamentos.idDepartamentos = centroCosto.Departamentos_idDepartamentos inner join direcciones on direcciones.idDirecciones = centroCosto.Direcciones_idDirecciones where departamentos.idDepartamentos in (select  Departamentos_idDepartamentos from usuarios inner join centrocosto on centroCosto.idCentroCosto = usuarios.CentroCosto_idCentroCosto where usuarios.idUsuarios = ?) order by idRequisiciones desc;',[decoded.id])
    conn.end()
    return res.status(200).json(requis[0])
  } catch (error) {
    return res.status(401).json(error)
  }
} 

//ver una sola requisicion por id
export const showRequiById =async(req:Request,res:Response):Promise<Response>=>{
  if(!req.body){ res.status(400).json({msg: 'envia toda la informacion'})}
  const idRequi = req.body.idRequi;
  try {
    const conn = await connect();
    const requi = await conn.query('SELECT idRequisiciones,fecha,justificacion,nombre,apellido,centroCosto,departamento,direccion FROM inagua_requis.requisiciones inner join usuarios on usuarios.idUsuarios = requisiciones.Usuarios_idUsuarios inner join centrocosto on centrocosto.idCentroCosto = requisiciones.CentroCosto_idCentroCosto inner join departamentos on departamentos.idDepartamentos = centroCosto.Departamentos_idDepartamentos inner join direcciones on direcciones.idDirecciones = centroCosto.Direcciones_idDirecciones where requisiciones.idRequisiciones = ?',[idRequi]);
    conn.end()
   return res.status(200).json(requi[0])
  } catch (error) {
    return res.status(401).json(error) 
  }
}

export const showMovimientosById = async(req:Request,res:Response):Promise<Response>=>{
  if(!req.body){ res.status(400).json({msg: 'envia toda la informacion'})}
  const idRequi = req.body.idRequi;
  try {
    const con = await connect();
    const movs = await con.query('SELECT idMovimiento,descripcion,cantidad,Unidades_idUnidades from movimiento inner join movimiento_has_requisiciones on movimiento_has_requisiciones.Movimiento_idMovimiento = movimiento.idMovimiento where movimiento_has_requisiciones.Requisiciones_idRequisiciones = ?',[idRequi]);
    con.end();
    return res.status(200).json(movs[0])
  } catch (error) {
    return res.status(401).json(error) 

  }
}