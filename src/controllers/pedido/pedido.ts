import { connect } from '../../database';
import {Request,response,Response} from 'express';
import jwt from "jsonwebtoken";
import config from '../../config';

export const requisicionPedido =async(req:Request,res:Response):Promise<Response>=>{
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
        conn = await pool.getConnection();
        const response:any = await conn.query('SELECT requi.idRequisiciones,requi.fecha,requi.justificacion,requi.estado,requi.Usuarios_requiriente as idRequiriente,requiriente.nombre,requiriente.apellido,requiriente.email,requiriente.telefono from requisiciones as requi join usuarios as requiriente on requiriente.idUsuarios = requi.Usuarios_requiriente where requi.idRequisiciones = ?',[arr.Nrequisicion]);
        pool.end()
        return res.status(200).json(response[0])
      } catch (error) {
        pool.end();
        return res.status(400).send(error)
        throw error;
      } 
}

//mis pedidos
export const misPedidos =async(req:Request,res:Response):Promise<Response>=>{
  if(!req.header){
      return res.status(400).json({ msg: 'Envia toda la informacion' })
  }
  let conn:any =null;
  const pool = await connect();
  try {
  const toke = req.headers["x-access-token"]?.toString();
  if(!toke) return res.status(403).json({ message: "sin token" })
  const decoded:any = jwt.verify(toke,config.SECRET);
  if(!decoded) return res.status(404).json({ message:' token invalido ' })
      conn = await pool.getConnection();
      const response:any = await conn.query('SELECT * from pedido where idUsuarios = ?',[decoded.id]);
      pool.end()
      return res.status(200).json(response[0])
    } catch (error) {
      pool.end();
      return res.status(400).send(error)
      throw error;
    } 
}

//movimientos por id requisicion
export const showMovimientosByIdPedido = async(req:Request,res:Response):Promise<Response>=>{
  if(!req.body){ res.status(400).json({msg: 'envia toda la informacion'})}
  const idRequi = req.body.Nrequisicion;
  const con = await connect();
  try {
    const movs:any = await con.query('SELECT idMovimiento,descripcion,cantidad,Unidades_idUnidades,cUnitarioAprox from movimiento where Requisiciones_idRequisiciones = ?',[idRequi]);
    con.end();
    if(movs[0].length === 0){return res.status(204).json('')}
    return res.status(200).json(movs[0])
  } catch (error) {
    con.end();
    return res.status(401).json(error) 
  }
}

// Funcion para crear un pedido y crear registro en historial
//
//Falta editar para realizar pedido
//
export const createPedido=async(req:Request,res:Response):Promise<Response>=>{
  if(!req.body || !req.header){
    return res.status(400).json({ msg: 'Envia toda la informacion' })
  }
console.log(req.body)
  let conn:any =null;
  const pool = await connect();

  try {
    const toke = req.headers["x-access-token"]?.toString();

    if(!toke) return res.status(403).json({ message: "sin token" })

    const decoded:any = jwt.verify(toke,config.SECRET);

    if(!decoded) return res.status(404).json({ message:' token invalido ' })

    const pedido = req.body;
    const movimientos = pedido.movimientos;    
    conn = await pool.getConnection();
      await conn.beginTransaction();
      const newPedido:any = await conn.query(`INSERT INTO pedido(idpedido,proveedor,NPadronProveedor,domicilio,telefono,email,contacto,plazoEntrega,lugarEntrega,fuenteFinanciamiento,periodoGarantia,emailRequiriente,extensionRequiriente,requisiciones_idRequisiciones,idRequiriente,idUsuarios,subtotal,iva,fecha)values(default,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,default)`,[pedido.proveedor,pedido.NPadronProveedor,pedido.domicilio,pedido.telefono,pedido.email,pedido.contacto,pedido.plazoEntrega,pedido.lugarEntrega,pedido.fuenteFinanciamiento,pedido.periodoGarantia,pedido.emailRequiriente,pedido.extensionRequiriente,pedido.Nrequisicion,pedido.idRequiriente,decoded.id,pedido.subtotal,pedido.iva]);

      const idNuevoPedido = newPedido[0].insertId;

      //Añadir al historial el movimiento realizado
      const histo = await conn.query('INSERT INTO historial(idhistorial,Usuarios_idUsuarios,Requisiciones_idRequisiciones,comentarios) values(default,?,?,?)',[decoded.id,pedido.Nrequisicion,'Pedido Creado']);

      movimientos.map(async(mov:any,index:number)=>{
        //update movimientos | pedidos
            await conn.query('UPDATE movimiento set idpedido = ?, precioPedido = ? where idMovimiento = ?',[idNuevoPedido,mov.cUnitarioAprox,mov.idMovimiento])
        })
      //Mensaje en consola
      console.log(`REQUISICION CREADA --> Id Usuario: ${decoded.id} | Requisición: ${pedido.Nrequisicion} | Time: ${new Date()}`)

      await conn.commit();
      pool.end()
      
      return res.status(200).json({ msg:'success' })

      } catch (error) {
        if (conn) await conn.rollback();
        pool.end();
        console.log(error)
        return res.status(400).send(error)
        throw error;
      } 
}

export const pedidoDetalles =async(req:Request,res:Response):Promise<Response>=>{
  if(!req.body || !req.header){
      return res.status(400).json({ msg: 'Envia toda la informacion' })
  }
  let conn:any =null;
  const pool = await connect();
  const info = req.body;
  try {
  const toke = req.headers["x-access-token"]?.toString();
  if(!toke) return res.status(403).json({ message: "sin token" })
  const decoded:any = jwt.verify(toke,config.SECRET);
  if(!decoded) return res.status(404).json({ message:' token invalido ' })
  const arr = req.body;
      conn = await pool.getConnection();
      const resPedido:any = await conn.query('Select idpedido,proveedor,NPadronProveedor,domicilio,pedido.telefono,pedido.email,contacto,plazoEntrega,lugarEntrega,fuenteFinanciamiento,periodoGarantia,emailRequiriente,extensionRequiriente,requisiciones_idRequisiciones,idRequiriente,pedido.idUsuarios,subtotal,iva,fecha, usu.nombre as RNombre,usu.apellido as RApellido,usu.email as REmail, usu.telefono as RTelefono from pedido join usuarios as usu on usu.idUsuarios = pedido.idRequiriente where idpedido = ? and pedido.idUsuarios = ?',[info.idpedido,decoded.id]);
      const resMovimientos:any = await conn.query('Select * from movimiento where idpedido = ?',[info.idpedido]);
      resPedido[0][0].movimientos = resMovimientos[0]
      pool.end()
      return res.status(200).json(resPedido[0])
    } catch (error) {
      pool.end();
      return res.status(400).send(error)
      throw error;
    } 
}