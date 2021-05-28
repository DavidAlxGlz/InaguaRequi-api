import { connect } from '../../database';
import {Request,response,Response} from 'express';
import jwt from "jsonwebtoken";
import config from '../../config';

export const getProveedores =async(req:Request,res:Response):Promise<Response>=>{
    if(!req.body || !req.header){
        return res.status(400).json({ msg: 'Envia toda la informacion' })
    }
    let conn:any =null;
    const pool = await connect();
    try {
        conn = await pool.getConnection();
        const response:any = await conn.query('SELECT * from proveedores order by idProveedor asc')
        console.log(response[0])
        pool.end()
        return res.status(200).json(response[0])
    } catch (error) {
        pool.end()
        return res.status(400).send(error)
        console.log(error)
    }
}