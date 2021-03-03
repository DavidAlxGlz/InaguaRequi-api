import { connect } from '../../database';
import {Request,Response} from 'express';
import jwt from "jsonwebtoken";
import config from '../../config';

export const createVale =async(req:Request,res:Response):Promise<Response>=>{
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
    const conn = await pool.getConnection();
    await conn.beginTransaction();
    const vale:any = await conn.query('INSERT INTO vales(idVales,Proveedores_idProveedor,Requisiciones_idRequisiciones,fecha,autoriza_idUsuarios) values(default,?,?,?.?)',[arr.Proveedores_idProveedor,arr.Requisiciones_idRequisiciones,arr.fecha,decoded.id]);
    //cambiar por select para obtener el id del vale creado
    const idNuevoVale = vale[0].insertId
    const movimientos = arr.movimientos;
    movimientos.map(async(mov:any,index:number)=>{
    //update movimientos | Vales_idVales
        await conn.query('UPDATE movimiento set Vales_idVales = ? where idMovimiento = ?',[idNuevoVale,mov.idMovimiento])
    })
    await conn.commit();
    pool.end();
    return res.status(200).json(vale)
    } catch (error) {
        if (conn) await conn.rollback();
        pool.end();
        return res.send(error)
        throw error;
    }
}