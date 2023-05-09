import fastify from "fastify";
import { connect, Schema, model } from "mongoose";
import fs from "fs";

const server = fastify({ logger: true });
connect("mongodb://localhost:27017/apiHotwing")
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