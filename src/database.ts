import { createPool } from "mysql2/promise";

export async function connect(){

   const connection = await createPool({
      
        host: 'localhost',
        user: 'root',
        password: 'crypwpgs1',
        database: 'inagua_requis',
       
    });
        
    return connection;
    
}