import express from "express";
import cors from "cors";
import clienteRouter from "../src/controllers/cliente-controller.js";
import filtroRouter from "../src/controllers/filtro-controller.js";
import notificacionRouter from "../src/controllers/notificacion-controller.js";
import productoRouter from "../src/controllers/producto-controller.js";
import repartidorRouter from "../src/controllers/repartidor-controller.js";
import stockRouter from "../src/controllers/stock-controller.js";
import visitaRouter from "../src/controllers/visita-controller.js";
import estadisticasRouter from "../src/controllers/estadisticas-controller.js";

const app = express();

app.use(express.json());
app.use(cors());

app.use("/api/cliente", clienteRouter);
app.use("/api/filtro", filtroRouter);
app.use("/api/notificacion", notificacionRouter);
app.use("/api/producto", productoRouter);
app.use("/api/repartidor", repartidorRouter);
app.use("/api/stock", stockRouter);
app.use("/api/visita", visitaRouter);
app.use("/api/estadisticas", estadisticasRouter);

app.get("/", (req, res) => {
    res.json({ mensaje: "¡El backend de AquaFlash está vivo y funcionando!" });
});

export default app;
