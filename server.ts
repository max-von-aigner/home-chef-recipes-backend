import express from "express";
import { PrismaClient } from "@prisma/client";
import { json } from "express";


const app = express();
const prisma = new PrismaClient();
const port = 3000;
app.use(json());




//get all recipe


app.get("/recipe", async (req, res) => {
    try {
      let allRecipe = await prisma.recipe.findMany();
  
      res.status(200).send(allRecipe);
    } catch (error) {
      res.status(500).send({ message: "Something went wrong!" });
    }
  });


//create a recipe



//update a recipe

//add comments



app.post("/recipe",)
app.listen(port, () => {
console.log(`⚡ Server listening on port: ${port}`);
});
