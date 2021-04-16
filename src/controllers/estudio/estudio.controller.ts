import { connect } from '../../database';
import {Request,Response} from 'express';


export const getMovimientosEstudio = async(req:Request,res:Response):Promise<Response>=>{
    if(!req.body || !req.header){
        return res.status(400).json({ msg: 'Envia toda la informacion' })
    }
    const requi = req.body.idRequi;
    console.log(requi)
    try {
      const con = await connect();
      const response = await con.query('select * from movimiento where Requisiciones_idRequisiciones = ?',[requi]);
      con.end();
      console.log(response[0])
      return res.status(200).json(response[0])
    } catch (error) {
      return res.status(401).json(error) 
    }
  }

  export const getProveedoresEstudio = async(req:Request,res:Response):Promise<Response>=>{
    try {
      const con = await connect();
      const response = await con.query('select * from proveedores');
      con.end();
      return res.status(200).json(response[0])
    } catch (error) {
      return res.status(401).json(error) 
    }
  }