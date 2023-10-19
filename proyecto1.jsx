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
    estado: String
  });

  // Crear modelos
  const Usuario = mongoose.model("Usuario", usuarioSchema);
  const Restaurante = mongoose.model("Restaurante", restauranteSchema);
  const Pedido = mongoose.model("Pedido", pedidoSchema);
  // Datos provisionales
  // Restaurante
  // const nuevoRestauranteDummy = new Restaurante({
  //   nombre: "Restaurante Dummy",
  //   categoria: "Comida Internacional",
  //   popularidad: 3
  // });
  
  // try {
  //   await nuevoRestauranteDummy.save();
  //   console.log("Restaurante Dummy guardado con éxito.");
  // } catch (err) {
  //   console.error("Error al guardar el restaurante Dummy:", err);
  // }
  const usuarioId = new mongoose.Types.ObjectId();
//   const restauranteId = new mongoose.Types.ObjectId();
// Pedido
// const nuevoPedidoDummy = new Pedido({
//   usuarioId: usuarioId,
//   restauranteId: restauranteId,
//   productos: [
//     { productoId: new mongoose.Types.ObjectId(), cantidad: 2 },
//     { productoId: new mongoose.Types.ObjectId(), cantidad: 1 }
//   ],
//   total: 39.99,
//   estado: "pendiente"
// });

// try {
//   await nuevoPedidoDummy.save();
//   console.log("Pedido Dummy guardado con éxito.");
// } catch (err) {
//   console.error("Error al guardar el pedido Dummy:", err);
// }
// Usuario

// const nuevoUsuarioDummy = new Usuario({
//   nombre: "Usuario Dummy",
//   correoElectrónico: "dummy@example.com",
//   contraseña: "123456",
//   numeroCelular: "9876543210",
//   dirección: "Dirección Dummy",
//   rol: "cliente"
// });

// // Guardar el usuario dummy en la base de datos utilizando promesas
// nuevoUsuarioDummy.save()
//   .then(usuario => {
//     console.log("Usuario dummy guardado con éxito.");
//   })
//   .catch(err => {
//     console.error("Error al guardar el usuario dummy:", err);
//   });

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
    const { correo, contraseña, id } = req.query;
  
    if (id) {
      try {
        const usuario = await Usuario.findById(id);
        if (!usuario) {
          return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        return res.json(usuario);
      } catch (err) {
        return res.status(500).json({ error: 'Error al buscar el usuario' });
      }
    } else if (correo && contraseña) {
      try {
        const usuario = await Usuario.findOne({ correoElectronico: correo, contraseña: contraseña });
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
  

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
});
