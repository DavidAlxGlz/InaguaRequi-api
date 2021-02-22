
import { connect } from '../../database';
import {Request,Response} from 'express';

export const infoUnidades=async(req:Request,res:Response): Promise<Response>=>{
    try {
        const conn = await connect()
        const response:any = await conn.query('SELECT * FROM unidades')
        conn.end()
        return res.status(200).json(response[0])

    } catch (error) {
        
    }

return res.status(200).json({})
}