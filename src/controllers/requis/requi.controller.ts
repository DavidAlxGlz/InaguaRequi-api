import { connect } from '../../database';
import {Request,Response} from 'express';
import jwt from "jsonwebtoken";
import config from '../../config';



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

export const infoUsuario =async(req:Request,res:Response)=>{
  try {
      const toke = req.headers["x-access-token"]?.toString();  
      if(!toke) return res.status(403).json({ message: "sin token" })
      const decoded:any = jwt.verify(toke,config.SECRET);
      if(!decoded) return res.status(404).json({ message:' token invalido '})
      const conn = await connect()
      const idUsuario = decoded.id;
      const UserSelect:any = await conn.query('select nombre,apellido,centroCosto,Departamentos_idDepartamentos,Direcciones_idDirecciones from usuarios inner join centrocosto on usuarios.CentroCosto_idCentroCosto = centrocosto.idCentroCosto where usuarios.idUsuarios = ?',[idUsuario])
      const {nombre,apellido,centroCosto,Departamentos_idDepartamentos,Direcciones_idDirecciones} = UserSelect[0][0];
      //if(!user){
      //   return res.status(400).json({msg:'el usuario no existe'})
      // }
     res.status(200).json({nombre,apellido,centroCosto})
  } catch (error) {
      return res.status(401).json({ message: 'no autorizado' })
  }
}