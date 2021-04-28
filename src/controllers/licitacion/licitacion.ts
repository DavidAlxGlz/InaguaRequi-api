import { connect } from '../../database';
import {Request,Response} from 'express';
import jwt from "jsonwebtoken";
import config from '../../config';

//añadir licitacion
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
        await conn.beginTransaction();
        const requi:any = await conn.query('INSERT INTO licitaciones (idLicitaciones,Requisiciones_idRequisiciones,fecha_programada) values(default,?,?)',[arr.idRequisicion,arr.fechaProgramada]);

       //Añadir al historial
       const histo = await conn.query('INSERT INTO historial(idhistorial,Usuarios_idUsuarios,Requisiciones_idRequisiciones,comentarios,nuevoEstado) values(default,?,?,?,?)',[decoded.id,arr.idRequisicion,'',4]);

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