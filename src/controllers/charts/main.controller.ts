import { connect } from '../../database';
import {Request,Response} from 'express';

export const infoMainDashboard =async(req:Request,res:Response)=>{
    let conn:any = null;
    let respuesta:any=[]
    const pool = await connect();
    try {
        conn = await pool.getConnection();
        const SO:any = await conn.query('SELECT count(REQ.idRequisiciones) as Solicitudes FROM inagua_requis.requisiciones as REQ where REQ.estado = 1;')
        const AP:any = await conn.query('SELECT count(REQ.idRequisiciones) as AprobadasPresupuesto FROM inagua_requis.requisiciones as REQ where REQ.estado = 3;')
        const AA:any = await conn.query('SELECT count(REQ.idRequisiciones) as AprobadasAdquisiciones FROM inagua_requis.requisiciones as REQ where REQ.estado = 5;')
        const ACC:any = await conn.query('SELECT count(REQ.idRequisiciones) as AprobadaCajaChica FROM inagua_requis.requisiciones as REQ where REQ.estado = 8;')
        const FI:any = await conn.query('SELECT count(REQ.idRequisiciones) as Finalizadas FROM inagua_requis.requisiciones as REQ where REQ.estado = 6 and REQ.estado = 9;')
        const CA:any = await conn.query('SELECT count(REQ.idRequisiciones) as Canceladas FROM inagua_requis.requisiciones as REQ where REQ.estado = 0;')
        respuesta = [SO[0][0].Solicitudes,AP[0][0].AprobadasPresupuesto,AA[0][0].AprobadasAdquisiciones,ACC[0][0].AprobadaCajaChica,FI[0][0].Finalizadas,CA[0][0].Canceladas]
        pool.end()
        res.status(200).json({msg:"success",data:respuesta})
      } catch (error) {
        pool.end()
        return res.status(401).json({ message: 'sin respuesta' }) 
      }
  }