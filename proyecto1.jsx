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

db.on("error", console.error.bind(console, "Error de conexión a la base de datos:"));
db.once("open", async () => {
  console.log("Conexión a la base de datos exitosa.");

  // Definir modelos y esquemas para colecciones
  const usuarioSchema = new mongoose.Schema({
    nombre: String,
    correoElectronico: String,
    contraseña: String,
    numeroCelular: String,
    direccion: String,
    rol: String
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
