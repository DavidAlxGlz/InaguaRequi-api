import { connect } from '../../database';
import {Request,Response} from 'express';


export const getDirectores =async(req:Request,res:Response):Promise<Response>=>{
    try {
        const conn = await connect();
        const directores = await conn.query('SELECT * FROM inagua_requis.directores;');
        conn.end()
       return res.status(200).json(directores[0])
      } catch (error) {
        return res.status(401).json({ message: 'no autorizado' }) 
      }
  }