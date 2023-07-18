const mongoose = require("mongoose");

//mongoose.set('strictQuery', false); // Ajout de la ligne pour désactiver strictQuery

mongoose
  .connect("mongodb+srv://" + process.env.DB_USER_PASS + "@cluster0.qh2yjee.mongodb.net/projet-resaux-social",
   {
    useNewUrlParser: true,
    useUnifiedTopology: true,
   })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log("failed to connect to MongoDB", err));

