import fastify from "fastify";
import { genSalt, hash } from "bcrypt";
import { connect, Schema, model } from "mongoose";
import {AccountDto } from "./models/accountDto.js";
import fs from "fs";
import jwt from "jsonwebtoken";

const server = fastify({ logger: true });
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



const CreateAccount = model("account", AccountDto);


// Inscription
server.post("/account", async (request, reply) => {
  const { email, password } = request.body;

  const existAccount = await CreateAccount.find({ email: email });
  if (existAccount.length > 0) {
    reply.code(403).send("compte deja créer");
  } else {
    try {
      const salt = await genSalt(10);
      const hashedPassword = await hash(password, salt);
      const account = new CreateAccount({ email, password: hashedPassword });
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
    const user = await CreateAccount.findOne({ email });
    if (!user) {
      throw new Error("Email ou mot de passe incorrect");
    }
    const validPassword = await compare(password, user.password);
    if (!validPassword) {
      throw new Error("Email ou mot de passe incorrect");
    }

    // Si les informations d'identification sont valides, créer le jeton JWT
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    reply.code(200).send({ token });
  } catch (error) {
    console.log(error);
    reply.code(401).send("Identifiants invalides");
  }
});




// Delete compte
server.delete("/account/:id", async (request, reply) => {
  const accountId = request.params.id;
  try {
    await CreateAccount.findByIdAndDelete(accountId);
    reply.code(200).send("Compte supprimé avec succès !");
  } catch {
    reply
      .code(500)
      .send("Une erreur est survenue lors de la suppression du compte");
  }
});
