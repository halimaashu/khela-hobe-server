const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");

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

const JWKS = createRemoteJWKSet(new URL("http://localhost:3000/api/auth/jwks"));
const veryFyToken = async (req, res, next) => {
  const authHeader = req?.headers?.authorization;
  const token = authHeader.split(" ")[1];
  if (!authHeader && !token) {
    return res.status(401).json({ massage: "Unauthorized access" });
  }
  // console.log(token)
  try {
    const { payload } = await jwtVerify(token, JWKS);
    console.log(payload);
    next();
  } catch (error) {
    return res.status(403).json({ massage: "Invalid token" });
  }
};
async function run() {
  try {
    await client.connect();
    const db = client.db("khela-hobe");
    const featuredCollection = db.collection("featured");
    const bookingsCollection = db.collection("bookings");
    console.log("Successfully connected to MongoDB!");

    app.get("/", (req, res) => {
      // async unnecessary here since no await is used
      res.send("khele hobe server is running");
    });

    app.post("/add-facility", async (req, res) => {
      const facility = req.body;
      const result = await featuredCollection.insertOne(facility);
      res.json(result);
    });
    app.post("/booking", veryFyToken, async (req, res) => {
      const booking = req.body;
      const result = await bookingsCollection.insertOne(booking);
      res.json(result);
    });

    app.get("/featured", async (req, res) => {
      const result = await featuredCollection.find({}).toArray();
      res.json(result);
    });
    app.get("/featured/:id", veryFyToken, async (req, res) => {
      const { id } = req.params;
      // console.log(id,"from server")
      const result = await featuredCollection.findOne({
        _id: new ObjectId(id),
      });
      res.json(result);
    });

    app.get("/booking/:userId", veryFyToken, async (req, res) => {
      const { userId } = req.params;
      const result = await bookingsCollection.find({ userId }).toArray();
      res.json(result);
    });
    app.delete("/booking/:bookingId", veryFyToken, async (req, res) => {
      const { bookingId } = req.params;
      const result = await bookingsCollection.deleteOne({
        _id: new ObjectId(bookingId),
      });
      res.json(result);
    });

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error("MongoDB connection failed:", err); // ✅ Proper error handling
    process.exit(1);
  }
}

run();
