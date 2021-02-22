import {Request,Response} from 'express';
import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken';
import config from "../config";
import { connect } from "../database";

const encryptPassword = async(password:any)=>{
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password,salt);
}

const comparePassword = async (password:any,recivedPassword:any)=>{
    return await bcrypt.compare(password,recivedPassword)
}

export const signUp = async (req:Request,res:Response):Promise<Response> =>{
    if(!req.body.usuario || !req.body.password){
        return res.status(400).json({ msg: 'Envia toda la informacion' })
    }
    const conn = await connect()
    const usuarioT = req.body.usuario;
    const us:any = await conn.query('select * from usuarios where usuario = ?',[usuarioT])
    if(us[0].length > 0){ return res.status(400).json('El usuario ya existe ok' ) }
    const user = us[0][0];
    const passEncrypt = await encryptPassword(req.body.password);
    const reqUser = req.body;
    console.log(reqUser)
    reqUser.password = passEncrypt;
    const insertUser =  await conn.query('INSERT INTO inagua_requis.usuarios (idUsuarios,usuario,password,nombre,apellido,Roles_idRoles,CentroCosto_idCentroCosto)VALUES(default,?,?,?,?,?,?)',[reqUser.usuario,reqUser.password,reqUser.nombre,reqUser.apellido,reqUser.Roles_idRoles,reqUser.CentroCosto_idCentroCosto])
    conn.end()
    return res.send(insertUser)
}


export const signIn = async (req:Request,res:Response):Promise<Response> =>{
    if(!req.body.usuario || !req.body.password){
        return res.status(400).json({ msg: 'envia toda la informacion' })
    }
    const conn = await connect()
    const usuarioT = req.body.usuario;
    const us:any = await conn.query('select * from usuarios where usuario = ?',[usuarioT])
    const user = us[0][0];
    if(!user){
        return res.status(400).json({msg:'el usuario no existe'})
    }
    const matchPassword = await comparePassword(req.body.password ,user.password)
    if(!matchPassword) return res.status(401).json({ token: null, msg:'Contrasena invalida' })
    const token = jwt.sign({ id: user.idUsuarios }, config.SECRET,{
        expiresIn:28800 //8 horas
    })
    conn.end()
   
    return res.json({token})
}