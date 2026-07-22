import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const required = ['DATABASE_USER', 'DATABASE_PASSWORD', 'DATABASE_NAME'];
for (const key of required) {
    if (!process.env[key]) {
        throw new Error(`Falta la variable de entorno ${key} en el archivo .env`);
    }
}

const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool({
    host: process.env.DATABASE_HOST || 'localhost',
    port: Number(process.env.DATABASE_PORT || 5432),
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    ssl: isProduction ? { rejectUnauthorized: false } : false
});

export default pool;