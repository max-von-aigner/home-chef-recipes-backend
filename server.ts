import express from "express";
import { PrismaClient } from "@prisma/client";
import { json } from "express";
const cors = require("cors");

import jwt from "jsonwebtoken";
import { JwtPayload } from "jsonwebtoken";
import { toToken } from "./auth/jwt";
import { AuthMiddleware, AuthRequest } from "./auth/middleware";

const prisma = new PrismaClient();
const port = 3000;

// Create an express app
const app = express();

// Tell the app to allow json in the request body
app.use(json());
app.use(cors());

//get all recipe

app.get("/recipe", async (req, res) => {
  try {
    let allRecipe = await prisma.recipe.findMany({
      include: {
        category: true,
        comment: true,
      },
    });

    res.status(200).send(allRecipe);
  } catch (error) {
    res.status(500).send({ message: "Something went wrong!" });
  }
});

// Sign-up endpoint 👇🏻
app.post("/sign_up", async (req, res) => {
  const requestBody = req.body;
  if ("username" in requestBody && "password" in requestBody) {
    try {
      await prisma.user.create({
        data: requestBody,
      });
      res.status(201).send({ message: "User created!" });
    } catch (error) {
      // If we get an error, send back HTTP 500 (Server Error)
      res.status(500).send({ message: "Something went wrong!" });
    }
  } else {
    // If we are missing fields, send back a HTTP 400
    res
      .status(400)
      .send({ message: "'username' and 'password' are required!" });
  }
});

//Log-in endpoint 👇🏻
app.post("/login", async (req, res) => {
  const requestBody = req.body;
  if ("username" in requestBody && "password" in requestBody) {
    try {
      // First find the user
      const userToLogin = await prisma.user.findUnique({
        where: {
          username: requestBody.username,
        },
      });
      if (userToLogin && userToLogin.password === requestBody.password) {
        const token = toToken({ userId: userToLogin.id });
        res.status(200).send({ token: token });
        return;
      }
      // If we didn't find the user or the password doesn't match, send back an error message
      res.status(400).send({ message: "Login failed" });
    } catch (error) {
      // If we get an error, send back HTTP 500 (Server Error)
      res.status(500).send({ message: "Something went wrong!" });
    }
  } else {
    // If we are missing fields, send back a HTTP 400
    res
      .status(400)
      .send({ message: "'username' and 'password' are required!" });
  }
});

//create-recipe

app.post("/create-recipe", AuthMiddleware, async (req: AuthRequest, res) => {
  const {
    name,
    category,
    img_url,
    instructions,
    ingredients,
    prep_time,
    serves,
  } = req.body;

  const userIdThatMadeTheRequest = Number(req.userId);

  // This check here makes sure we have the userId on the request
  if (!req.userId) {
    res.status(500).send("Something went wrong");
    return;
  }

  if ("message" in req.body) {
    try {
      await prisma.recipe.create({
        data: {
          name,
          img_url,
          instructions,
          ingredients,
          prep_time,
          serves,
          category,
          user: {
            connect: {
              id: userIdThatMadeTheRequest,
            },
          },
        },
      });
      res.status(201).send({ message: "Post created!" });
    } catch (error) {
      res.status(500).send({ message: "Something went wrong!" });
    }
  } else {
    res.status(400).send({ message: "'message' and 'userId' are required!" });
  }
});

//get-category

app.get("/category", async (req, res) => {
  try {
    let allCategory = await prisma.category.findMany({
      include: {
        recipe: true,
      },
    });

    res.status(200).send(allCategory);
  } catch (error) {
    res.status(500).send({ message: "Something went wrong!" });
  }
});

app.listen(port, () => {
  console.log(`⚡ Server listening on port: ${port}`);
});

//get-recipe-by-id

app.get("/recipe/:id", async (req, res) => {
  const idAsNumber = parseInt(req.params.id);

  try {
    const a_recipe = await prisma.recipe.findUnique({
      where: {
        id: idAsNumber,
      },
      include: {
        comment: true,
      },
    });

    if (!a_recipe) {
      res.status(404).send({
        message: "Recipe with that id not found",
      });
    }

    res.send(a_recipe);
  } catch (error) {
    res.status(500).send({ message: "Something went wrong!" });
  }
});
