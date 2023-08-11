const express = require("express");
const session = require("express-session");
const app = express();
const mongoose = require("mongoose");
const User = require("./models/user");
app.set("view engine", "ejs");

// Configurarea portului pentru server
const port = 4000; // Alegeți portul dorit

// Adăugăm middleware pentru a procesa corpul cererilor POST (formularele de autentificare vor fi trimise prin POST)
app.use(express.urlencoded({ extended: true }));
//analizează cererile POST de tip JSON și le transformă în obiecte JSON accesibile în cererea req.body
app.use(express.json());
// Setează folderul pentru fișierele statice
app.use(express.static(__dirname));
// Utilizăm sesiuni pentru a gestiona starea utilizatorilor autentificați
app.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: false,
  })
);
//Setarea motorului de vizualizare pentru șabloanele EJS
app.set("view engine", "ejs");

// Conectăm baza de date MongoDB
async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/joc");
}
// Apelăm funcția main() pentru a realiza conexiunea cu baza de date
main().catch((err) => console.log(err));

app.get("/regulament", (req, res) => {
  res.render("regulament");
});

// Rutele aplicației
app.get("/joc", (req, res) => {
  const { error } = req.query;
  res.render("joc", { error });
});
app.get("/adevarate", (req, res) => {
  // Verificăm dacă utilizatorul este autentificat
  if (!req.session.userId) {
    return res.redirect("/joc"); // Redirecționăm către pagina "/joc" dacă utilizatorul nu este logat
  }

  const { error } = req.query;
  res.render("adevarate", { error: error || null });
});

app.post("/joc", async (req, res) => {
  const { username } = req.body;

  try {
    // Verificăm dacă utilizatorul există deja în baza de date
    const existingUser = await User.findOne({ username });

    if (existingUser) {
      // Utilizatorul există deja
      const errorMessage = encodeURIComponent(
        "Numele de utilizator este deja luat."
      );
      return res.redirect(`/joc?error=${errorMessage}`);
    } else {
      // Creăm un nou utilizator în baza de date
      const user = new User({ username });
      await user.save();

      // Setăm sesiunea pentru utilizatorul înregistrat
      req.session.userId = user._id;
      res.redirect("/trimite-mesaj");
    }
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});
app.use("/trimite-mesaj", async (req, res, next) => {
  // Verificăm dacă utilizatorul este autentificat
  if (!req.session.userId) {
    return res.redirect("/joc"); // Redirecționăm către pagina "/joc"
  }

  try {
    // Verificăm dacă utilizatorul există în baza de date
    const user = await User.findById(req.session.userId);

    if (!user) {
      return res.redirect("/joc"); // Redirecționăm către pagina "/joc"
    }

    // Utilizatorul este autentificat și există în baza de date, putem continua cu ruta "/trimite-mesaj"
    next();
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

app.get("/trimite-mesaj", async (req, res) => {
  try {
    // Obțineți toți utilizatorii din baza de date
    const users = await User.find();

    const { error } = req.query;
    res.render("trimite-mesaj", { error, users });
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

app.post("/trimite-mesaj", async (req, res) => {
  const { destinatar, mesaj } = req.body;

  try {
    // Găsim utilizatorul destinatar în baza de date
    const destinatarUser = await User.findOne({ username: destinatar });

    if (!destinatarUser) {
      // Utilizatorul destinatar nu există
      const errorMessage = "Utilizatorul destinatar nu există în baza de date.";
      return res.redirect(
        `/trimite-mesaj?error=${encodeURIComponent(errorMessage)}`
      );
    }

    // Adăugăm mesajul în array-ul de mesaje al destinatarului
    destinatarUser.mesaje.push(mesaj);
    await destinatarUser.save();

    // Redirecționăm utilizatorul către pagina "mesaje-primite" fără a primi un mesaj
    res.redirect("/mesaje-primite?mesaj=false");
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

app.get("/mesaje-primite", async (req, res) => {
  try {
    // Obțineți utilizatorul logat din baza de date
    const user = await User.findById(req.session.userId);

    if (!user) {
      return res.redirect("/joc"); // Redirecționează către pagina "/joc" dacă utilizatorul nu este autentificat
    }

    const mesaje = user.mesaje; // Obțineți lista de mesaje primite ale utilizatorului
    const mesaj = req.query.mesaj;
    const removedMessage = req.query.removedMessage; // Adăugăm variabila removedMessage

    if (mesaj === "false") {
      // Nu se afișează niciun mesaj inițial
      res.render("mesaje-primite", { mesaj: null, user, removedMessage }); // Adăugăm removedMessage în parametrii
    } else if (mesaj === "true") {
      // Se afișează un mesaj random
      if (mesaje.length === 0) {
        // Nu există mesaje primite, redirecționăm către pagina "/mesaje-primite"
        res.render("mesaje-primite", { mesaj: null, user, removedMessage }); // Adăugăm removedMessage în parametrii
      } else {
        const randomIndex = Math.floor(Math.random() * mesaje.length); // Generăm un index random
        const randomMessage = mesaje[randomIndex]; // Obținem mesajul random

        // Renderează pagina "mesaje-primite" cu mesajul random
        res.render("mesaje-primite", {
          mesaj: randomMessage,
          user,
          removedMessage,
        }); // Adăugăm removedMessage în parametrii
      }
    } else {
      // Se afișează mesajul trimis
      res.render("mesaje-primite", { mesaj, user, removedMessage }); // Adăugăm removedMessage în parametrii
    }
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

app.get("/genereaza-mesaj-random", async (req, res) => {
  try {
    // Obțineți utilizatorul logat din baza de date
    const user = await User.findById(req.session.userId);

    if (!user) {
      return res.redirect("/joc"); // Redirecționează către pagina "/joc" dacă utilizatorul nu este autentificat
    }

    const mesaje = user.mesaje; // Obțineți lista de mesaje primite ale utilizatorului

    if (mesaje.length === 0) {
      // Nu există mesaje primite, redirecționăm către pagina "/mesaje-primite"
      return res.redirect("/mesaje-primite");
    }

    const randomIndex = Math.floor(Math.random() * mesaje.length); // Generăm un index random
    const randomMessage = mesaje[randomIndex]; // Obținem mesajul random

    // Ștergem mesajul generat din lista de mesaje primite
    mesaje.splice(randomIndex, 1);
    await user.save();

    // Renderează pagina "mesaje-primite" cu mesajul random
    res.redirect(`/mesaje-primite?mesaj=${encodeURIComponent(randomMessage)}`);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

// Startul serverului
app.listen(port, () => {
  console.log(`Serverul a pornit și ascultă pe portul ${port}`);
});
