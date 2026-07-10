class Cliente {
    constructor (id = 0, nombre = "", direccion = "", telefono = "", deuda = 0.00, activo = false, ultimo_pago = "", ultima_compra = "", es_promocion = false, repartidor_id = 0, fecha_inicio_promo = "", fecha_creacion = "", frecuencia_visitas = ""){
        this.id = id;
        this.nombre = nombre;
        this.direccion = direccion;
        this.telefono = telefono;
        this.deuda = deuda;
        this.activo = activo;
        this.ultimo_pago = ultimo_pago;
        this.ultima_compra = ultima_compra;
        this.es_promocion = es_promocion;
        this.repartidor_id = repartidor_id;
        this.fecha_inicio_promo = fecha_inicio_promo;
        this.fecha_creacion = fecha_creacion;
        this.frecuencia_visitas = frecuencia_visitas;
    }
}

export default Cliente;