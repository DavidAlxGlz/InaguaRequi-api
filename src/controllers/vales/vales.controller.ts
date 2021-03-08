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
    const vale:any = await conn.query('INSERT INTO vales(idVales,Proveedores_idProveedor,Requisiciones_idRequisiciones,fecha,autoriza_idUsuarios) values(default,?,?,?,?)',[arr.Proveedores_idProveedor,arr.Requisiciones_idRequisiciones,arr.fecha,decoded.id]);
    //cambiar por select para obtener el id del vale creado
    console.log(vale)
    const idNuevoVale = vale[0].insertId
    const movimientos = arr.movimientos;
    movimientos.map(async(mov:any,index:number)=>{
    //update movimientos | Vales_idVales
    console.log(mov.idMovimiento)
        await conn.query('UPDATE movimiento set Vales_idVales = ? where idMovimiento = ?',[idNuevoVale,mov.idMovimiento])
    })
    await conn.commit();
    pool.end();
    return res.status(200).json(vale)
    } catch (error) {
        if (conn) await conn.rollback();
        pool.end();
        return res.status(401).json(error)
        throw error;
    }
}

export const infoProveedor=async(req:Request,res:Response):Promise<Response>=>{
    try {
        const conn = await connect();
        const proveedores = await conn.query('SELECT * from proveedores')
        conn.end()
        return res.status(200).json(proveedores[0])
    } catch (error) {
        return res.status(401).json(error)
    }

}


export const infoProveedorById=async(req:Request,res:Response):Promise<Response>=>{
    if(!req.body){ res.status(400).json({msg: 'envia toda la informacion'})}
  const idProveedor = req.body.Proveedores_idProveedor;
    try {
        const conn = await connect();
        const proveedor:any = await conn.query('SELECT * from proveedores where idProveedor = ?',[idProveedor]);
        conn.end()
        console.log(proveedor[0])
        if(proveedor[0].length === 0){return res.status(204).json({})}
        return res.status(200).json(proveedor[0])
    } catch (error) {
        return res.status(401).json(error)
    }
}

export const getVale = async(req:Request,res:Response):Promise<Response>=>{
    if(!req.body){
        res.status(400).json({ msg: 'envia toda la informacion' })
    }
    const idVale = req.body.idVale;
    try {
        const conn = await connect();
        const vale:any = await conn.query('')
    } catch (error) {
        console.log(error)
        return res.status(401).json(error)
    }

    return res
}