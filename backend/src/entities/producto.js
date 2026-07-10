class Producto {
    constructor (id = 0, nombre = "", cantidad_minima_fabrica = 0, cantidad = 0, precio = 0){
        this.id = id;
        this.nombre = nombre;
        this.cantidad_minima_fabrica = cantidad_minima_fabrica;
        this.cantidad = cantidad;
        this.precio = precio;
    }
}

export default Producto