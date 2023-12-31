import express from "express";
import { PrismaClient } from "@prisma/client";
import { json } from "express";
const cors = require("cors");
import { z } from "zod";
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

app.post("/register", async (req, res) => {
  const requestBody = req.body;

  //Zod validator for user registration
  const userValidator = z
    .object({
      username: z.string().min(5),
      password: z.string().min(10),
    })
    .strict();

  const parsedBody = userValidator.safeParse(requestBody);

  if (parsedBody.success === true) {
    try {
      const existingUser = await prisma.user.findUnique({
        where: {
          username: requestBody.username,
        },
      });

      if (existingUser) {
        res.status(400).send("Please try a different username");
        return;
      }

      const newUser = await prisma.user.create({
        data: requestBody,
      });
      res.status(201).send("Created a new user");
    } catch (error) {
      res.status(500).send({ message: "Something went wrong!", error });
    }
  } else {
    res.status(400).send(parsedBody.error.flatten());
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
  if (!req.userId) {
    res.status(500).send("Something went wrong");
    return;
  }

  // This check here makes sure we have the userId on the request
  if (!req.userId) {
    res.status(500).send("Something went wrong");
    return;
  }

  if (
    "name" in req.body &&
    "instructions" in req.body &&
    "ingredients" in req.body &&
    "prep_time" in req.body &&
    "category" in req.body &&
    "serves" in req.body &&
    "img_url" in req.body
  ) {
    const userIdThatMadeTheRequest = Number(req.userId);
    try {
      await prisma.recipe.create({
        data: {
          userId: userIdThatMadeTheRequest,
          name: req.body.name,
          img_url: req.body.img_url,
          instructions: req.body.instructions,
          ingredients: req.body.ingredients,
          prep_time: Number(req.body.prep_time),
          serves: Number(req.body.serves),
          category: {
            connect: req.body.category,
          },
        },
      });
      res.status(201).send({ message: "Post created!" });
    } catch (error) {
      console.log(error);
      res.status(500).send({ message: "Something went wrong!" });
    }
  } else {
    res.status(400).send({ message: "All fields are required" });
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
        category: true,
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

//add comment to recipe

app.post("/comments/:id", async (req, res) => {
  // Here we can write our functionality
  console.log(req.params);
  const recipeId = Number(req.params.id);
  if ("name" in req.body && "rating" in req.body && "message" in req.body) {
    // // SUCCESS
    await prisma.comment.create({
      data: {
        name: req.body.name,
        rating: Number(req.body.rating),
        message: req.body.message,
        recipeId: recipeId,
      },
    });
  }
});

app.get("/dashboard", AuthMiddleware, async (req: AuthRequest, res) => {
  const userIdThatMadeTheRequest = Number(req.userId);

  const userDatials = await prisma.recipe.findMany({
    where: {
      userId: userIdThatMadeTheRequest,
    },
  });
  res.send(userDatials);
});

//pactch request

app.get("/edit/:id", async (req, res) => {
  console.log(req.params);
  const idAsNumber = parseInt(req.params.id);
  console.log(idAsNumber);
  try {
    const a_recipe = await prisma.recipe.findUnique({
      where: {
        id: idAsNumber,
      },
    });

    console.log(a_recipe);
    if (!a_recipe) {
      return res.status(404).send({ error: "Recipe not found" });
    }

    res.send(a_recipe);
  } catch (error) {
    console.error("Error fetching/editing recipe:", error);
    res.status(500).send({ message: "Something went wrong!" });
  }
});
