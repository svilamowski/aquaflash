import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

let supabaseUrl = process.env.SUPABASE_URL;
let supabaseKey = process.env.SUPABASE_ANON_KEY;

if (supabaseUrl) {
    supabaseUrl = supabaseUrl
        .trim()                 // 1. Borra espacios invisibles y saltos de línea
        .replace(/['"]/g, '')   // 2. Borra comillas si Docker las metió
        .replace(/\/$/, '');    // 3. Borra la barra diagonal al final si existe
}

if (supabaseKey) {
    supabaseKey = supabaseKey.trim().replace(/['"]/g, '');
}

console.log("🔍 URL SANEADA:", supabaseUrl);

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Faltan las credenciales de Supabase en el archivo .env');
}

export const supabase = createClient(supabaseUrl, supabaseKey);