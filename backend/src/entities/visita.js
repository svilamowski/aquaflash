class Visita {
    constructor (id = 0, cliente_id = 0, repartidor_id = 0, compro = false, monto_pagado = 0, monto_total_venta = 0, fecha = ""){
        this.id = id;
        this.cliente_id = cliente_id;
        this.repartidor_id = repartidor_id;
        this.compro = compro;
        this.monto_pagado = monto_pagado;
        this.monto_total_venta = monto_total_venta;
        this.fecha = fecha;
    }
}

export default Visita;