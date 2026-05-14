import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const serverDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)));
dotenv.config({ path: path.join(serverDir, "..", ".env") });

const ai = new GoogleGenAI({ apiKey: "AIzaSyAgfYBNAbkoEph4wB8jHj9GkZ5RqX4P24w" });

const pager = await ai.models.list();
let page = pager.page;

console.log("--- All model names ---");
for (const model of page) {
    console.log(model.name);
}
