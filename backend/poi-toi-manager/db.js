import pg from 'pg'
const Pool=pg.Pool

import dotenv from 'dotenv'
dotenv.config();

const pool=new Pool({
    user:process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT 
})

export {pool};