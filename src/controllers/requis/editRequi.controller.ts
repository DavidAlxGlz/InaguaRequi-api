import { connect } from '../../database';
import {Request,Response} from 'express';
import jwt from "jsonwebtoken";
import config from '../../config';

//Solicitantes por usuario
export const solicitantes =async(req:Request,res:Response)=>{
    let conn:any = null;
    const pool = await connect();
    try {
        const toke = req.headers["x-access-token"]?.toString();  
        if(!toke) return res.status(403).json({ message: "sin token" })
        const decoded:any = jwt.verify(toke,config.SECRET);
        if(!decoded) return res.status(404).json({ message:' token invalido '})
        conn = await pool.getConnection();
        const idUsuario = decoded.id;
        const response:any = await conn.query('select * from solicitantes inner join usuarios as usuario on usuario.idUsuarios = solicitantes.Usuarios_idUsuarios where solicitantes.Usuario = ?',[idUsuario])
        pool.end()
        res.status(200).json({msg:'success',solicitantes:response[0]})
      } catch (error) {
        pool.end()
        return res.status(401).json({ message: 'no autorizado' }) 
      }
  }