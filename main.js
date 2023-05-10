import fastify from "fastify";
import cors from "@fastify/cors";
import { genSalt, hash, compare } from "bcrypt";
import { connect, Schema, model } from "mongoose";
import { AccountDto } from "./models/accountDto.js";
import fs from "fs";
import jwt from "jsonwebtoken";
import { imageDto } from "./models/imageDto.js";
import multer from "fastify-multer";
import { imgUpload } from "./functions/images.js";
import { generateRandomString } from "./functions/url.js";

const server = fastify({ logger: true });

server.register(multer.contentParser);

//Probleme de cors
server.register(cors, {
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
const ImageUser = model("imageUser", imageDto);

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

  const decodedToken = jwt.verify(token, "16UQLq1HZ3CNwhvgrarV6pMoA2CDjb4tyF");

  const userId = decodedToken.userId;

  try {
    const userAccount = await Account.findById(userId);

    if (!userAccount) {
      return reply.code(404).send("Compte non trouvé");
    }

    await Account.findByIdAndDelete(userId);

    const imagesAccount = await ImageUser.find({ userId: userId });
    imagesAccount.forEach(async (element) => {
      fs.unlink(element.name, (err) => {
        if (err) {
          console.error(err);
          return;
        }
        console.log("Le fichier a été supprimé avec succès");
      });

      await ImageUser.findByIdAndDelete(element.id);
    });
    reply.code(200).send("Compte supprimé avec succès !");
  } catch (error) {
    console.log(error);

    reply.code(401).send("Authentification invalide");
  }
});

// delete image

server.delete("/deleteImage/:imageId", async (request, reply) => {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return reply.code(403).send("Authentification invalide");
  }

  const token = authHeader.slice(7);

  const decodedToken = jwt.verify(token, "16UQLq1HZ3CNwhvgrarV6pMoA2CDjb4tyF");

  const userId = decodedToken.userId;

  try {
    const imageId = request.params.imageId;
    const searchimageUser = await ImageUser.findById(imageId);

    if (userId != searchimageUser.userId) {
      return reply.code(403).send("interdit de supprimer image");
    }
    fs.unlink(searchimageUser.name, (err) => {
      if (err) {
        console.error(err);
        return;
      }
      console.log("Le fichier a été supprimé avec succès");
    });
    const image = await ImageUser.findByIdAndDelete(imageId);

    if (!image) {
      return reply.code(404).send("Image non trouvée");
    }

    reply.code(200).send("Image supprimée avec succès !");
  } catch (error) {
    console.log(error);

    reply.code(401).send("Authentification invalide");
  }
});

// send image

server.post("/images", { preHandler: imgUpload }, async (request, reply) => {
  const authHeader = request.headers.authorization;
  const token = authHeader.slice(7);
  const decodedToken = jwt.verify(token, "16UQLq1HZ3CNwhvgrarV6pMoA2CDjb4tyF");
  const userId = decodedToken.userId;
  const userAccount = await Account.findById(userId);
  if (!userAccount) {
    return reply.code(404).send("Compte non trouvé");
  }

  const name = `uploads/${request.file.filename}`;
  const date = Date();
  const isPublic = false;
  let url = generateRandomString();
  let isUrlExist = true;
  let urlExist = await ImageUser.find({ url: url });

  if (urlExist.length == 0) {
    isUrlExist = false;
  } else {
    while (isUrlExist) {
      url = generateRandomString();
      urlExist = await ImageUser.find({ url: url });
      if (urlExist.length == 0) {
        isUrlExist = false;
      }
    }
  }
  const newImage = new ImageUser({ date, name, isPublic, url, userId });
  await newImage.save();
  reply.code(201).send("image enregistré");
});

// Get all no connecte soit isPublic true

server.get("/images", async (request, reply) => {
  try {
    const images = await ImageUser.find({ isPublic: true });
    const imageData = await Promise.all(
      images.map(async (image) => {
        return {
          id: image._id,
          name: image.name,
          date: image.date,
          isPublic: image.isPublic,
          url: image.url,
        };
      })
    );
    reply.send(imageData);
  } catch (error) {
    console.log(error);
    reply.code(500).send("Erreur serveur");
  }
});

// Get all image for user and all true and false is connecte

server.get("/imagesUser", async (request, reply) => {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return reply.code(403).send("Authentification invalide");
    }
    // Vérifier que l'utilisateur est connecté et que son token JWT correspond bien à l'utilisateur en question
    const token = authHeader.slice(7);

    const decodedToken = jwt.verify(
      token,
      "16UQLq1HZ3CNwhvgrarV6pMoA2CDjb4tyF"
    );

    const userId = decodedToken.userId;
    // Récupérer toutes les images, qu'elles soient publiques ou privées
    const images = await ImageUser.find({ userId: userId });

    // Construire le tableau de données à renvoyer
    const imageData = await Promise.all(
      images.map(async (image) => {
        return {
          id: image._id,
          name: image.name,
          date: image.date,
          isPublic: image.isPublic,
          url: image.url,
        };
      })
    );

    // Renvoyer les données
    reply.send(imageData);
  } catch (error) {
    console.log(error);
    reply.code(500).send("Erreur serveur");
  }
});

// Update bool image

server.put("/images/:id", async (request, reply) => {
  try {
    // Récupérer l'identifiant de l'image à mettre à jour depuis les paramètres de l'URL
    const imageId = request.params.id;

    // Vérifier que l'utilisateur est connecté et que son token JWT correspond bien à l'utilisateur en question
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return reply.code(403).send("Authentification invalide");
    }

    const token = authHeader.slice(7);

    const decodedToken = jwt.verify(
      token,
      "16UQLq1HZ3CNwhvgrarV6pMoA2CDjb4tyF"
    );

    const userId = decodedToken.userId;

    // Récupérer l'image correspondant à l'identifiant et vérifier que l'utilisateur est autorisé à la modifier
    const image = await ImageUser.findById(imageId);

    if (!image) {
      return reply.code(404).send("Image non trouvée");
    }

    if (image.userId !== userId) {
      return reply.code(403).send("Non autorisé à modifier cette image");
    }

    image.isPublic = !image.isPublic;

    await image.save();

    // Renvoyer la nouvelle version de l'image

    reply.send({
      id: image._id,
      name: image.name,
      date: image.date,
      url: image.url,
    });
  } catch (error) {
    console.log(error);
    reply.code(500).send("Erreur serveur");
  }
});
