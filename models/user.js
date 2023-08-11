// Importăm modulul Mongoose
const mongoose = require("mongoose");
// Definim schema pentru colecția "users"
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  mesaje: {
    type: [String],
    default: [],
  },
});
// Cream modelul "User" pe baza schemei definite
const User = mongoose.model("User", userSchema);
// Exportăm modelul "User" pentru a fi utilizat în alte module
module.exports = User;
