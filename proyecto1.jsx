const express = require('express');
const app = express();
const port = 3000;
const mongoose = require("mongoose");
// Configura la conexión a la base de datos
mongoose.connect("mongodb://localhost/tu_basededatos", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
app.use(express.json());
db.on("error", console.error.bind(console, "Error de conexión a la base de datos:"));
db.once("open", async () => {
  console.log("Conexión a la base de datos exitosa.");

  // Definir modelos y esquemas para colecciones
  const usuarioSchema = new mongoose.Schema({
    nombre: String,
    correoElectronico: {
      type: String,
      required: true
    },
    contraseña: {
      type: String,
      required: true
    },
    numeroCelular: String,
    direccion: String,
    rol: String,
    habilitado: {
      type: Boolean,
      default: true  // Valor por defecto es habilitado (true)
    }  // Campo para habilitar/deshabilitar al usuario
  });
  

  const restauranteSchema = new mongoose.Schema({
    nombre: String,
    categoria: String,
    popularidad: Number
    popularidad: Number,
    habilitado: {
      type: Boolean,
      default: true  // Valor por defecto es habilitado (true)
    } 
  });
  const productoSchema = new mongoose.Schema({
    nombre: String,
    descripcion: String,
    precio: Number,
    categoria: String,
    restauranteId: {
      type:mongoose.Schema.Types.ObjectId,
      required: true
    },
    habilitado: {
      type: Boolean,
      default: true  // Valor por defecto es habilitado (true)
    }  // Referencia al restaurante al que pertenece
  });
  

  
  const pedidoSchema = new mongoose.Schema({
    usuarioId: mongoose.Schema.Types.ObjectId,
    restauranteId: mongoose.Schema.Types.ObjectId,
    productos: [
      {
        productoId: mongoose.Schema.Types.ObjectId,
        cantidad: Number
      }
    ],
    total: Number,
    estado: String,
    fechaPedido: {
      type: Date,
      default: Date.now  // Valor por defecto es la fecha y hora actual
    },
    habilitado: {
      type: Boolean,
      default: true  // Valor por defecto es habilitado (true)
    }
  });
  

  // Crear modelos
  const Producto = mongoose.model("Producto", productoSchema);
  const Usuario = mongoose.model("Usuario", usuarioSchema);
  const Restaurante = mongoose.model("Restaurante", restauranteSchema);
  const Pedido = mongoose.model("Pedido", pedidoSchema);


  // CRUD Usuario
  app.post('/usuarios', async (req, res) => {
    try {
      const { nombre, correoElectronico, contraseña, numeroCelular, direccion, rol } = req.body;
  
      // Crea una instancia del modelo de usuario con los datos proporcionados
      const nuevoUsuario = new Usuario({
        nombre,
        correoElectronico,
        contraseña,
        numeroCelular,
        direccion,
        rol,
      });
  
      // Guarda el usuario en la base de datos
      await nuevoUsuario.save();
  
      res.status(201).json({ mensaje: 'Usuario creado con éxito' });
    } catch (error) {
      console.error('Error al crear el usuario:', error);
      res.status(500).json({ error: 'Error al crear el usuario' });
    }
  });
  // READ usuario por ID o correo&contraseña
  app.get('/usuarios', async (req, res) => {
    const { correoElectronico, contraseña, _id } = req.query;

    if (mongoose.Types.ObjectId.isValid(_id)) {
      try {
        const usuario = await Usuario.findById(_id);
        if (!usuario) {
          return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        return res.json(usuario);
      } catch (err) {
        return res.status(500).json({ error: 'Error al buscar el usuario' });
      }
    } else if (correoElectronico && contraseña) {
      try {
        const usuario = await Usuario.findOne({ correoElectronico: correoElectronico, contraseña: contraseña });
        if (!usuario) {
          return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        return res.json(usuario);
      } catch (err) {
        return res.status(500).json({ error: 'Error al buscar el usuario' });
      }
    } else {
      return res.status(400).json({ error: 'Parámetros no válidos' });
    }
  });
// UPDATE usuario dado un id.
app.put('/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, correoElectronico, contraseña, numeroCelular, direccion, rol } = req.body;

  // Validar que el ID sea válido
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'ID de usuario no válido' });
  }

  try {
    const usuario = await Usuario.findByIdAndUpdate(id, {
      nombre,
      correoElectronico,
      contraseña,
      numeroCelular,
      direccion,
      rol
    }, { new: true });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    return res.json(usuario);
  } catch (err) {
    return res.status(500).json({ error: 'Error al actualizar el usuario' });
  }
});
// DELETE inhabilitar usuario.
app.patch('/usuarios/:id/deshabilitar', async (req, res) => {
  const usuarioId = req.params.id;

  try {
    // Verificar si el usuario con el ID proporcionado existe en la base de datos
    const usuario = await Usuario.findById(usuarioId);

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Cambiar la propiedad "habilitado" a false
    usuario.habilitado = false;

    // Guardar el usuario actualizado
    await usuario.save();

    return res.json({ message: 'Usuario deshabilitado con éxito' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error al deshabilitar el usuario' });
  }
});

  
  
  
  // CRUD Restaurante
    // READ retorna restaurantes que pertenezcan a la categoría proveída y/o su nombre se asemeje a la búsqueda.
app.get('/restaurantes/busqueda', async (req, res) => {
  try {
    const { categoria, nombre } = req.query;
    let query = {};

    if (categoria) {
      query.categoria = categoria;
    }

    if (nombre) {
      query.nombre = { $regex: new RegExp(nombre, 'i') };
    }

    const restaurantes = await Restaurante.find(query);

    if (restaurantes.length === 0) {
      return res.status(404).json({ message: 'No se encontraron restaurantes que coincidan con los criterios de búsqueda.' });
    }

    return res.json(restaurantes);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error al buscar restaurantes.' });
  }
});
  // READ retorna los datos del restaurante que corresponde a la id proveída.
  app.get('/restaurantes/:id', async (req, res) => {
    const id = req.params.id;
  
    try {
      const restaurante = await Restaurante.findOne({ _id: new mongoose.Types.ObjectId(id) }).exec();
      if (restaurante) {
        res.json(restaurante);
      } else {
        res.status(404).json({ error: 'Restaurante no encontrado' });
      }
    } catch (err) {
      res.status(500).json({ error: 'Error al buscar el restaurante' });
    }
  });


  // UPDATE modifica los datos del usuario que corresponde a la id proveída.
  app.put('/restaurantes/:id', async (req, res) => {
    const restauranteId = req.params.id;
    const { nombre, categoria, popularidad } = req.body;
  
    try {
      // Verifica si el ID del restaurante es válido
      if (!mongoose.Types.ObjectId.isValid(restauranteId)) {
        return res.status(400).json({ error: 'ID de restaurante no válido' });
      }
  
      // Busca el restaurante por ID y actualiza sus datos
      const restaurante = await Restaurante.findByIdAndUpdate(
        restauranteId,
        { nombre, categoria, popularidad },
        { new: true } // Devuelve el restaurante actualizado
      );
  
      if (!restaurante) {
        return res.status(404).json({ error: 'Restaurante no encontrado' });
      }
  
      res.json(restaurante);
    } catch (error) {
      console.error('Error al actualizar el restaurante:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });
  // DELETE deshabilita un restaurante basado en la id proveída.
app.patch('/restaurantes/:id/deshabilitar', async (req, res) => {
  const restauranteId = req.params.id;
  try {
    const restaurante = await Restaurante.findById(restauranteId);
    if (!restaurante) {
      return res.status(404).json({ error: 'Restaurante no encontrado' });
    }

    restaurante.habilitado = false;
    await restaurante.save();
    return res.json({ message: `Restaurante deshabilitado con éxito` });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error al deshabilitar el restaurante' });
  }
});


  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
  // CRUD productos
  // CREATE un producto
  app.post('/productos', async (req, res) => {
    try {
      const { nombre, descripcion, precio, restauranteId } = req.body;
  
      // Validar que todos los campos requeridos estén presentes
      if (!nombre || !descripcion || !precio || !restauranteId) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
      }
  
      // Verificar si el restaurante existe
      const restaurante = await Restaurante.findById(restauranteId);
      if (!restaurante) {
        return res.status(404).json({ error: 'Restaurante no encontrado' });
      }
  
      // Crear el producto
      const nuevoProducto = new Producto({
        nombre,
        descripcion,
        precio,
        restauranteId,
      });
  
      await nuevoProducto.save();
  
      return res.json({ message: 'Producto creado con éxito' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Error al crear el producto' });
    }
  // READ un producto basado en su id.

  });
  app.get('/productos/busqueda', async (req, res) => { // Por algun motivo usar /productos/busqueda no funciona
    try {
      const { restauranteId, categoria } = req.query;
      let query = {};
  
      if (restauranteId && !mongoose.Types.ObjectId.isValid(restauranteId)) {
        return res.status(400).json({ error: 'ID de restaurante no válido' });
      }
  
      if (restauranteId) {
        query.restauranteId = restauranteId; 
      }
  
      if (categoria) {
        query.categoria = categoria;
      }
  
      const productos = await Producto.find(query);
  
      if (productos.length === 0) {
        return res.status(404).json({ message: 'No se encontraron productos que coincidan con los criterios de búsqueda.' });
      }
  
      return res.json(productos);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Error al buscar productos.' });
    }
  });
  
  app.get('/productos/:id', async (req, res) => {
    const productoId = req.params.id;
    try {
      // Realiza una búsqueda en la base de datos para encontrar el producto con el ID proporcionado
      const producto = await Producto.findById(productoId);
  
      if (!producto) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }
  
      return res.json(producto);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Error al buscar el producto' });
    }
  });
  
  
  
  
  
  // UPDATE modifica los datos del producto que corresponde a la id proveída, usando los datos proveídos
  app.put('/productos/:id', async (req, res) => {
    try {
      const productoId = req.params.id;
      const { nombre, descripcion, precio, categoria, restauranteId } = req.body;
  
      // Verificar si el ID del producto es válido
      if (!mongoose.Types.ObjectId.isValid(productoId)) {
        return res.status(400).json({ error: 'ID de producto no válido' });
      }
  
      // Verificar si el producto existe
      const producto = await Producto.findById(productoId);
      if (!producto) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }
  
      // Actualizar los campos del producto con los datos proporcionados
      if (nombre) producto.nombre = nombre;
      if (descripcion) producto.descripcion = descripcion;
      if (precio) producto.precio = precio;
      if (categoria) producto.categoria = categoria;
      if (restauranteId) producto.restauranteId = restauranteId;
  
      // Guardar el producto actualizado en la base de datos
      await producto.save();
  
      return res.json({ message: 'Producto actualizado con éxito', producto });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Error al actualizar el producto' });
    }
  });
  // DELETE “inhabilita” un producto que corresponde a la id proveída.

  app.patch('/productos/:id/inhabilitar', async (req, res) => {
    try {
      const productoId = req.params.id;
  
      // Verificar si el ID del producto es válido
      if (!mongoose.Types.ObjectId.isValid(productoId)) {
        return res.status(400).json({ error: 'ID de producto no válido' });
      }
  
      // Verificar si el producto existe
      const producto = await Producto.findById(productoId);
      if (!producto) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }
  
      // "Inhabilitar" el producto (siempre establecer el campo habilitado en false)
      producto.habilitado = false;
  
      // Guardar el producto "inhabilitado" en la base de datos
      await producto.save();
  
      return res.json({ message: 'Producto inhabilitado con éxito', producto });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Error al inhabilitar el producto' });
    }
  });
  // CRUD de Pedidos
  // CREATE crea un pedido de un usuario a un restaurante en la base de datos con los datos enviados al backend
  app.post('/pedidos', async (req, res) => {
    try {
      const { usuarioId, restauranteId, productos, total, estado } = req.body;

      // Crea una instancia de Pedido con los datos recibidos
      const nuevoPedido = new Pedido({
        usuarioId,
        restauranteId,
        productos,
        total,
        estado
      });

      // Guarda el pedido en la base de datos
      await nuevoPedido.save();

      res.status(201).json({ mensaje: 'Pedido creado exitosamente' });
    } catch (error) {
      res.status(500).json({ error: 'Error al crear el pedido' });
    }
  });
  // READ retorna los datos de los pedidos realizados por el usuario proveído, enviados por el usuario proveído, pedidos a un
//restaurante proveído, y/o entre las fechas proveídas.
app.get('/pedidos/filtrados', async (req, res) => {
  try {
    const { usuarioId, restauranteId, enviadoPor, fechaInicio, fechaFin } = req.query;
    let condiciones = {};

    // Aplicar condiciones según los parámetros proporcionados
    if (usuarioId) {
      condiciones.usuarioId = usuarioId;
    }
    if (restauranteId) {
      condiciones.restauranteId = restauranteId;
    }
    if (enviadoPor) {
      condiciones.enviadoPor = enviadoPor;
    }
    if (fechaInicio && fechaFin) {
      condiciones.fechaPedido = {
        $gte: new Date(fechaInicio),
        $lte: new Date(fechaFin),
      };
    }

    const pedidosFiltrados = await Pedido.find(condiciones);

    res.status(200).json(pedidosFiltrados);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los pedidos filtrados' });
  }
});
 // READ retorna los datos de los pedidos enviados, pero sin aceptar.
  app.get('/pedidos/enviados-sin-aceptar', async (req, res) => {
    try {
      // Buscar todos los pedidos con estado "enviado". Se asume que 'realizado' es aceptar.
      const pedidosEnviadosSinAceptar = await Pedido.find({ estado: 'enviado' });
  
      res.status(200).json(pedidosEnviadosSinAceptar);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener los pedidos enviados sin aceptar' });
    }
  });
  
  // READ retorna los datos del pedido que corresponde a la id proveída.
  app.get('/pedidos/:id', async (req, res) => {
    try {
      const pedidoId = req.params.id;
  
      // Busca el pedido en la base de datos por su ID
      const pedido = await Pedido.findById(pedidoId);
  
      if (!pedido) {
        return res.status(404).json({ error: 'Pedido no encontrado' });
      }
  
      res.status(200).json(pedido);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener el pedido' });
    }
  });
  // UPDATE pedido por su ID
  
  app.put('/pedidos/:id', async (req, res) => {
    try {
      const pedidoId = req.params.id;
      const { productos, total, estado } = req.body;
  
      // Verificar si el pedido existe
      const pedido = await Pedido.findById(pedidoId);
  
      if (!pedido) {
        return res.status(404).json({ error: 'Pedido no encontrado' });
      }
  
      // Verificar si el pedido no ha sido enviado ni realizado (o en otro estado que permite modificaciones)
      if (pedido.estado === 'enviado' || pedido.estado === 'realizado') {
        return res.status(403).json({ error: 'No se pueden modificar pedidos enviados o realizados' });
      }
  
      // Actualizar los datos del pedido
      pedido.productos = productos;
      pedido.total = total;
      pedido.estado = estado;
  
      // Guardar el pedido actualizado en la base de datos
      await pedido.save();
  
      res.status(200).json({ mensaje: 'Pedido modificado exitosamente' });
    } catch (error) {
      res.status(500).json({ error: 'Error al modificar el pedido' });
    }
  });
  // DELETE El endpoint “inhabilita” un producto que corresponde a la id proveída.
  app.put('/pedidos/inhabilitar/:id', async (req, res) => {
    try {
      const pedidoId = req.params.id;
  
      // Buscar el producto en la base de datos por su ID
      const pedido = await Pedido.findById(pedidoId);
  
      if (!pedido) {
        return res.status(404).json({ error: 'Pedido no encontrado' });
      }
  
      // "Inhabilitar" el producto estableciendo habilitado en false
      pedido.habilitado = false;
  
      // Guardar el producto actualizado en la base de datos
      await pedido.save();
  
      res.status(200).json({ mensaje: 'Pedido inhabilitado exitosamente' });
    } catch (error) {
      res.status(500).json({ error: 'Error al inhabilitar el pedido' });
    }
  });
  
  
});
