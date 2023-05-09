import fastify from "fastify";
import { genSalt, hash } from "bcrypt";
import { connect, Schema, model } from "mongoose";
import fs from "fs";

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

const CreateAccount = model("CreateSchema", CreateAccountSchema);

server.post("/account", async (request, reply) => {
  //   console.log(request.body);
  const { email, password } = request.body;
  try {
    let hash = await hash(password, await genSalt(10));
    password = await hash(password, salt);
  } catch (error) {}

  const account = new CreateAccount({ email, password });
  await account.save();
  reply.code(201).send("Recettes enregistrées avec succès !");
});

server.delete("/account", async (request, reply) => {});
