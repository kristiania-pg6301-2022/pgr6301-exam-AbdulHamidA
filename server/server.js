import express from "express";
import * as path from "path";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import { fetchJSON } from "./utils.js";

import { MongoClient } from "mongodb";
import { NewsApi } from "./NewsApi.js";
import { WebSocketServer } from "ws";

dotenv.config();

const app = express();

const mongoClient = new MongoClient(process.env.MONGODB_URL);
mongoClient.connect().then(async () => {
  console.log("Connected to mongodb");
  app.use("/api/news", NewsApi(mongoClient.db("news")));
});

app.use(bodyParser.json());
app.use(cookieParser(process.env.COOKIE_SECRET));

const discovery_endpoint =
  "https://login.microsoftonline.com/organizations/v2.0/.well-known/openid-configuration";
const client_id = process.env.CLIENT_ID;
const scope = "openid";

if (!client_id) {
  throw new Error("Must setup CLIENT_ID environment");
}

app.get("/api/config", (req, res) => {
  res.json({ discovery_endpoint, client_id, scope });
});

app.get("/api/login", async (req, res) => {
  const { access_token } = req.signedCookies;

  const { userinfo_endpoint } = await fetchJSON(discovery_endpoint);

  const userinfo = await fetch(userinfo_endpoint, {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });
  if (userinfo.status === 401) {
    return res.sendStatus(401);
  } else if (userinfo.ok) {
    res.json(await userinfo.json());
  } else {
    console.error(`Failed: ${userinfo.status} ${userinfo.statusText}`);
    return res.sendStatus(500);
  }
});

app.post("/api/login", (req, res) => {
  const { access_token } = req.body;
  res.cookie("access_token", access_token, { signed: true });
  res.sendStatus(200);
});


app.get("/api/logingoogle", async (req, res) => {
  const { access_token } = req.signedCookies;

  const { userinfo_endpoint } = await fetchJSON(
    "https://accounts.google.com/.well-known/openid-configuration"
  );
  const userinfo = await fetchJSON(userinfo_endpoint, {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });

  res.json(userinfo);
});

app.post("/api/logingoogle", (req, res) => {
  const { access_token } = req.body;
  res.cookie("access_token", access_token, { signed: true });
  res.sendStatus(200);
});




// LOgout
app.post("/api/logout", async (req, res) => {



  const { account } = req.body;
  if(account.google != undefined) {

    const logout = await fetchJSON('https://www.google.com/accounts/Logout');
  
  } else {
    const logout = await fetchJSON('https://login.microsoftonline.com/common/oauth2/v2.0/logout?post_logout_redirect_uri=http://localhost:3000/');

  }
  res.cookie("access_token", null, { signed: false });
  res.sendStatus(200);
});





app.use(express.static("../client/dist"));
app.use((req, res, next) => {
  if (req.method === "GET" && !req.path.startsWith("/api")) {
    res.sendFile(path.resolve("../client/dist/index.html"));
  } else {
    next();
  }
});


const wsServer = new WebSocketServer({ noServer: true });

const sockets = [];
let news = [];

wsServer.on("connection", (socket) => {
  sockets.push(socket);
  setTimeout(async () => {
    news = await mongoClient.db("news")
    .collection("news")
    .find({})
    .sort({
      metacritic: -1,
    })
    .map(({  title, slug, text, category, author, date }) => ({
      title,
      slug,
      text,
      category,
      author,
      date,
    }))
    .limit(100)
    .toArray();
    socket.send(JSON.stringify(news));
  }, 1000, socket, news);
  socket.on("message", (data) => {

    setTimeout(async () => {
      news = await mongoClient.db("news")
      .collection("news")
      .find({})
      .sort({
        metacritic: -1,
      })
      .map(({  title, slug, text, category, author, date }) => ({
        title,
        slug,
        text,
        category,
        author,
        date,
      }))
      .limit(100)
      .toArray();
      for (const recipient of sockets) {
        recipient.send(JSON.stringify([...news]));
      }
    }, 1000, socket, news);

  });
});


const server = app.listen(process.env.PORT || 3000, () => {
  console.log(`Started on http://localhost:${server.address().port}`);
  server.on("upgrade", (req, socket, head) => {
    wsServer.handleUpgrade(req, socket, head, (socket) => {
      wsServer.emit("connection", socket, req);
    });
  });
});
