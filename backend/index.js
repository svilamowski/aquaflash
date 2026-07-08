import express from 'express';
import cors from 'cors';
import { supabase } from './pool.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); 
app.use(express.json()); 

// Ruta básica para comprobar que el servidor prendió
app.get('/', (req, res) => {
    res.json({ mensaje: '¡El backend de AquaFlash está vivo y funcionando!' });
});

// Ruta de prueba para confirmar que Supabase conectó bien
app.get('/test-db', async (req, res) => {
    try {
        // Le pedimos a Supabase que nos traiga la lista de repartidores
        const { data, error } = await supabase.from('repartidores').select('*');
        
        if (error) {
            throw error;
        }
        
        // Si todo sale bien, respondemos con los datos
        res.json({ repartidores: data });
    } catch (error) {
        console.error('Error en base de datos:', error.message);
        res.status(500).json({ error: 'Hubo un error al conectar con Supabase' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor de AquaFlash corriendo en http://localhost:${PORT}`);
});