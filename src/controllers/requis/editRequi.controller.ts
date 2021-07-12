import { connect } from '../../database';
import {Request,Response} from 'express';
import jwt from "jsonwebtoken";
import config from '../../config';
import { plantas } from './requi.controller';

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

  export const requiToEdit = async (req:Request,res:Response)=>{
    if(!req.body || !req.header){
      return res.status(400).json({ msg: 'Envia toda la informacion' })
    }
    console.log(req.body)
    let conn:any = null;
    const pool = await connect();
    try {
      const toke = req.headers["x-access-token"]?.toString();  
      if(!toke) return res.status(403).json({ message: "sin token" })
      const decoded:any = jwt.verify(toke,config.SECRET);
      if(!decoded) return res.status(404).json({ message:' token invalido '})
      conn = await pool.getConnection();
      const idUsuario = decoded.id;
      const idRequi = req.body.idR
      const requi:any = await conn.query('SELECT * FROM inagua_requis.requisiciones where idRequisiciones = ?',[idRequi])
      const movs:any = await conn.query('SELECT * FROM movimiento where Requisiciones_idRequisiciones = ?',[idRequi])
      const {idRequisiciones,fecha,justificacion,Usuarios_idUsuarios,CentroCosto_idCentroCosto,bienesOServicios,Usuarios_requiriente,Directores_idDirectores,estado,gastoCorriente,recursoPropio,recursoOtros,descOtros,vehiculo,planta}= requi[0][0]
      pool.end()
      res.status(200).json({msg:'success',requiInfo:{
        "idRequisiciones":idRequisiciones,
        "fecha":fecha,
        "justificacion":justificacion,
        "Usuarios_idUsuarios":Usuarios_idUsuarios,
        "CentroCosto_idCentroCosto":CentroCosto_idCentroCosto,
        "bienesOServicios":bienesOServicios,
        "Usuarios_requiriente":Usuarios_requiriente,
        "Directores_idDirectores":Directores_idDirectores,
        "estado":estado,
        "gastoCorriente":gastoCorriente,
        "recursoPropio":recursoPropio,
        "recursoOtros":recursoOtros,
        "descOtros":descOtros,
        "vehiculo":vehiculo,
        "planta":planta,
        "movimientos":movs[0]
      }})
    } catch (error) {
      pool.end()
      return res.status(401).json({ message: 'no autorizado' }) 
    }
  }