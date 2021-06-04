import { connect } from '../../database';
import {Request,Response} from 'express';


export const getDirectores =async(req:Request,res:Response):Promise<Response>=>{
  const conn = await connect();
    try {
        const directores = await conn.query('SELECT * FROM inagua_requis.directores;');
        conn.end()
       return res.status(200).json(directores[0])
      } catch (error) {
        conn.end()
        return res.status(401).json({ message: 'no autorizado' }) 
      }
  }

  export const getRoles =async(req:Request,res:Response):Promise<Response>=>{
    const conn = await connect();
    try {
        const roles = await conn.query('SELECT * FROM inagua_requis.roles;');
        conn.end()
       return res.status(200).json(roles[0])
      } catch (error) {
        conn.end()
        return res.status(401).json({ message: 'no autorizado' }) 
      }
  }

  export const getDepartamentos =async(req:Request,res:Response):Promise<Response>=>{
    const conn = await connect();
    try {
        const response = await conn.query('SELECT * FROM inagua_requis.departamentos;');
        conn.end()
       return res.status(200).json(response[0])
      } catch (error) {
        conn.end()
        return res.status(401).json({ message: 'no autorizado' }) 
      }
  }

  export const getUsuarios =async(req:Request,res:Response):Promise<Response>=>{
    const conn = await connect();
    try {
        const response = await conn.query('SELECT idUsuarios,nombre,apellido FROM inagua_requis.usuarios');
        conn.end()
       return res.status(200).json(response[0])
      } catch (error) {
        conn.end()
        return res.status(401).json({ message: 'no autorizado' }) 
      }
  }

  export const addSolicitante =async(req:Request,res:Response):Promise<Response>=>{
    if(!req.body.usuario || !req.body.solicitante){
      return res.status(400).json({ msg: 'Envia toda la información' })
    }
  const usuario = req.body.usuario;
  const solicitante = req.body.solicitante;
  const conn = await connect();
    try {
        const response = await conn.query('INSERT INTO solicitantes (Usuarios_idUsuarios,Usuario) values(?,?);',[solicitante,usuario]);
        conn.end()
       return res.status(200).json(response[0])
      } catch (error) {
        conn.end()
        return res.status(401).json({ message: 'no autorizado' }) 
      }
  }