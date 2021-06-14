import { connect } from '../../database';
import {Request,response,Response} from 'express';
import jwt from "jsonwebtoken";
import config from '../../config';

export const requisicionPedido =async(req:Request,res:Response):Promise<Response>=>{
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
        conn = await pool.getConnection();
        const response:any = await conn.query('SELECT requi.idRequisiciones,requi.fecha,requi.justificacion,requi.estado,requiriente.nombre,requiriente.apellido,requiriente.email,requiriente.telefono from requisiciones as requi join usuarios as requiriente on requiriente.idUsuarios = requi.Usuarios_requiriente where requi.idRequisiciones = ?',[arr.Nrequisicion]);
        pool.end()
        return res.status(200).json(response[0])
      } catch (error) {
        pool.end();
        return res.status(400).send(error)
        throw error;
      } 
}

//movimientos por id requisicion
export const showMovimientosByIdPedido = async(req:Request,res:Response):Promise<Response>=>{
  if(!req.body){ res.status(400).json({msg: 'envia toda la informacion'})}
  const idRequi = req.body.Nrequisicion;
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

// Funcion para crear un pedido y crear registro en historial
//
//Falta editar para realizar pedido
//
export const createPedido=async(req:Request,res:Response):Promise<Response>=>{
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
      const requi:any = await conn.query(`INSERT INTO requisiciones(idRequisiciones,fecha,justificacion,Usuarios_idUsuarios,CentroCosto_idCentroCosto,Directores_idDirectores,bienesOServicios,Usuarios_requiriente,estado,gastoCorriente,recursoPropio,recursoOtros,descOtros) values(default,default,?,?,?,?,?,?,?,?,?,?,?)`,[arr.justificacion,decoded.id,idCC,arr.Directores_idDirectores,arr.bienesOServicios,arr.Usuarios_requiriente,arr.estado,arr.gastoCorriente,arr.recursoPropio,arr.recursoOtros,arr.descOtros]);

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