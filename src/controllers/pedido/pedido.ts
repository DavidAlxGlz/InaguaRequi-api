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