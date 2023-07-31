import recipe from "./data/recipe.json";
import category from "./data/category.json";
import comment from "./data/comment.json";
import user from "./data/user.json";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const seed = async () => {
  for (let i = 0; i < user.length; i++) {
    await prisma.user.create({
      data: user[i],
    });
  }

  for (let i = 0; i < category.length; i++) {
    await prisma.category.create({
      data: category[i],
    });
  }

  for (let i = 0; i < recipe.length; i++) {
    await prisma.recipe.create({
      data: recipe[i],
    });
  }

  for (let i = 0; i < comment.length; i++) {
    await prisma.comment.create({
      data: comment[i],
    });
  }
};

seed();
