import { connect } from '../../database';
import {Request,Response} from 'express';
import Connection from 'mysql2/typings/mysql/lib/Connection';


export const createRequi=async(req:Request,res:Response):Promise<Response>=>{
    //if(!req.body.fecha || !req.body.justificacion || req.body.Usuarios_idUsuarios || req.body.CentroCosto_idCentroCosto){
     //   return res.status(400).json({ msg: 'Envia toda la informacion' })
    //}
    const pool = await connect();
    let conn =null;
    try {
        conn = await pool.getConnection();
        await conn.beginTransaction();
        const [response, meta] = await conn.query("SELECT * FROM unidades");
        console.log(response, meta);
        await conn.query("INSERT INTO unidades (idUnidades,unidad) values(default,'nuevo1sst')");
        await conn.query("INSERT INTO unidades (idUnidades,unidad) values(1,'nuevo2sst')");

        await conn.commit();
        return res.send('')
      } catch (error) {
        if (conn) await conn.rollback();
        return res.send('')
        throw error;
      } finally {
        if (conn) await conn.release();
      }
}