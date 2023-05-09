import fastify from "fastify";
import { genSalt, hash } from "bcrypt";
import { connect, Schema, model } from "mongoose";
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

const CreateAccountSchema = new Schema({
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
});

const CreateAccount = model("account", CreateAccountSchema);


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
