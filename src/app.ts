import 'reflect-metadata';
import express from 'express';
import morgan from 'morgan';
import cors from "cors";
import authRoutes from "./routes/auth.route";
import  specialRoutes  from "./routes/special.routes";


//initializations
const app = express();

//settings
app.set('port', process.env.port || 3000)

//middlewares
app.use(morgan('dev'));
app.use(cors());
app.use(express.urlencoded({extended:false}));
app.use(express.json());

//routes
app.get('/',(req, res)=> {
    res.send(`the api is at http:localhost:${app.get('port')}`);
});

app.use(authRoutes)
app.use(specialRoutes)




export default app;
