import { Router } from "express";
import { ObjectId } from "mongodb";
import slugify from "slugify";

export function NewsApi(mongoDatabase) {
  const router = new Router();

  router.get("/:slug", async (req, res) => {
    const slug = req.params.slug;
    const article = await mongoDatabase
      .collection("news")
      .findOne({ slug: slug });
    res.json(article);
  });

  router.get("/", async (req, res) => {
    const filter = {};
    if (req.query.author != undefined) {
      filter.author = req.query.author;
    }

    if (req.query.topic != undefined) {
      filter.category = req.query.topic;
    }

    const news = await mongoDatabase
      .collection("news")
      .find(filter)
      .sort({
        metacritic: -1,
      })
      .map(({ _id, title, slug, text, category, author, date }) => ({
        _id,
        title,
        slug,
        text,
        category,
        author,
        date,
      }))
      .limit(100)
      .toArray();
    res.json(news);
  });

  router.post("/add", async (req, res) => {
    const { title, text, category, author } = req.body;
    const slug = slugify(title);

    const article = await mongoDatabase
      .collection("news")
      .findOne({ slug: slug });
    if (article != null) {
      return res.sendStatus(400);
    }
    let date = new Date(Date.now()).toLocaleDateString();
    const result = mongoDatabase.collection("news").insertOne({
      title,
      slug,
      text,
      category,
      author,
      date,
    });
    res.status(200).send({ ok: true });

  });

  router.post("/save", async (req, res) => {
    const { title, text, category, account, _id } = req.body;
    const slug = slugify(title);

    const article = await mongoDatabase
      .collection("news")
      .findOne({ slug: slug });
    if (article != null && article._id != _id) {
      return res.sendStatus(400);
    }
    const ExistingArticle = await mongoDatabase
      .collection("news")
      .findOne({ _id: ObjectId(_id) });
    if (account != ExistingArticle.author) {
      return res.sendStatus(401);
    }

    const result = await mongoDatabase.collection("news").updateOne(
      { _id: ExistingArticle._id },
      {
        $set: {
          title: title,
          slug: slug,
          text: text,
          category: category,
        },
      },
      { returnNewDocument: true }
    );
    res.status(200).send({ ...result, oks: true });
  });

  return router;
}
