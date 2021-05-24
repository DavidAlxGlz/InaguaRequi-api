import { createPool } from "mysql2/promise";

export async function connect(){

   const connection = await createPool({
        host: 'localhost',
        user: 'root',
        password: 'Inagua2008',
        database: 'inagua_requis',
       
    });
    
    return connection;   
}