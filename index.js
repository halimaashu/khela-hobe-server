const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");

const app = express();
const PORT = process.env.PORT;
const uri = process.env.MONGO_URI;

app.use(cors());
app.use(express.json());

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const db = client.db("khela-hobe");
    const featuredCollection = db.collection("featured");
    console.log("Successfully connected to MongoDB!");

    app.get("/", (req, res) => {
      // async unnecessary here since no await is used
      res.send("khele hobe server is running");
    });
    

    app.post("/add-facility",async(req,res)=>{
      const facility=req.body;
      const result =await featuredCollection.insertOne(facility);
      res.json(result);
    })
    app.get("/featured",async(req,res)=>{
      const result =await featuredCollection.find({}).toArray();
      res.json(result);
    })

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error("MongoDB connection failed:", err); // ✅ Proper error handling
    process.exit(1);
  }
}

run();
