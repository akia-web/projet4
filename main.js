import fastify from "fastify";
import { genSalt, hash, compare } from "bcrypt";
import { connect, Schema, model } from "mongoose";
import { AccountDto } from "./models/accountDto.js";
import fs from "fs";
import jwt from "jsonwebtoken";

const server = fastify({ logger: true });

//Probleme de cors

server.register(require("fastify-cors"), {
  origin: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Authorization", "Content-Type"],
});

// Connexion DB

connect("mongodb://localhost:27017/account-projet4")
  .then(() => console.log("connecté"))
  .catch((erreur) => console.log(erreur));

const start = async () => {
  try {
    server.listen({ port: 3000 });
  } catch (err) {
    console.log(err);
  }
};

start();

const Account = model("account", AccountDto);

// Inscription
server.post("/account", async (request, reply) => {
  const { email, password } = request.body;

  const existAccount = await Account.find({ email: email });
  if (existAccount.length > 0) {
    reply.code(403).send("compte deja créer");
  } else {
    try {
      const salt = await genSalt(10);
      const hashedPassword = await hash(password, salt);
      const account = new Account({ email, password: hashedPassword });
      await account.save();
      reply.code(201).send("Compte créer");
    } catch (error) {
      console.log(error);
      reply
        .code(500)
        .send("Une erreur est survenue lors de la création du compte");
    }
  }
});

// Connexion avec token
server.post("/login", async (request, reply) => {
  const { email, password } = request.body;
  try {
    // Vérification de l'email et du mot de passe
    const user = await Account.findOne({ email });
    if (!user) {
      throw new Error("Email ou mot de passe incorrect");
    }
    const validPassword = await compare(password, user.password);
    if (!validPassword) {
      throw new Error("Email ou mot de passe incorrect");
    }

    console.log(user);
    // Si les informations d'identification sont valides, créer le jeton JWT
    const token = jwt.sign(
      { userId: user._id, bidule: "truc" },
      "16UQLq1HZ3CNwhvgrarV6pMoA2CDjb4tyF",
      {
        expiresIn: "1h",
      }
    );
    reply.code(200).send({ token });
  } catch (error) {
    console.log(error);
    reply.code(401).send("Identifiants invalides");
  }
});

// Delete compte
server.delete("/account", async (request, reply) => {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return reply.code(403).send("Authentification invalide");
  }
  const token = authHeader.slice(7);
  console.log(token);

  const decodedToken = jwt.verify(token, "16UQLq1HZ3CNwhvgrarV6pMoA2CDjb4tyF");
  const userId = decodedToken.userId;

  console.log(userId);

  try {
    const userAccount = await Account.findById(userId);
    if (!userAccount) {
      return reply.code(404).send("Compte non trouvé");
    }

    await Account.findByIdAndDelete(userId);
    reply.code(200).send("Compte supprimé avec succès !");
  } catch (error) {
    console.log(error);
    reply.code(401).send("Authentification invalide");
  }
});

// send image
// server.post("image", async (request, reply) => {

// })
