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

// server.post("/account", async (request, reply) => {
//   //   console.log(request.body);
//   const { email, password } = request.body;
//   try {
//     let hash = await hash(password, await genSalt(10));
//     password = await hash(password, salt);
//   } catch (error) {}

//   const account = new CreateAccount({ email, password });
//   await account.save();
//   reply.code(201).send("Recettes enregistrées avec succès !");
// });


server.post("/account", async (request, reply) => {
  const { email, password } = request.body;
  try {
    const salt = await genSalt(10);
    const hashedPassword = await hash(password, salt);
    const account = new CreateAccount({ email, password: hashedPassword });
    await account.save();
    reply.code(201).send("Recettes enregistrées avec succès !");
  } catch (error) {
    console.log(error);
    reply
      .code(500)
      .send("Une erreur est survenue lors de la création du compte");
  }
});




server.delete("/account", async (request, reply) => {});
