import express from "express";
import cors from "cors";
import pool from "./src/database/pool.js";
import clienteRouter from "./src/controllers/cliente-controller.js";
import filtroRouter from "./src/controllers/filtro-controller.js";
import notificacionRouter from "./src/controllers/notificacion-controller.js";
import productoRouter from "./src/controllers/producto-controller.js";
import repartidorRouter from "./src/controllers/repartidor-controller.js";
import stockRouter from "./src/controllers/stock-controller.js";
import visitaRouter from "./src/controllers/visita-controller.js";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

app.use("/api/cliente", clienteRouter);
app.use("/api/filtro", filtroRouter);
app.use("/api/notificacion", notificacionRouter);
app.use("/api/producto", productoRouter);
app.use("/api/repartidor", repartidorRouter);
app.use("/api/stock", stockRouter);
app.use("/api/visita", visitaRouter);

app.get("/", (req, res) => {
    res.json({ mensaje: "¡El backend de AquaFlash está vivo y funcionando!" });
});

app.get("/test-db", async (req, res) => {
    try {
        const { rows } = await pool.query("SELECT * FROM repartidores");
        res.json({ repartidores: rows });
    } catch (error) {
        console.error("Error en base de datos:", error.message);
        res.status(500).json({ error: "Hubo un error al conectar con PostgreSQL" });
    }
});

app.listen(port, () => {
    console.log(`Servidor de AquaFlash corriendo en http://localhost:${port}`);
});
