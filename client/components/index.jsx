import React from "react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { fetchJSON, getCats } from "./utils";
import { useParams } from "react-router-dom";

const colorMain = "#ca5959";

export function TopBar({ account }) {
  const acc = account && account.name ? account : false;

  return (
    <div
      style={{
        width: "100%",
        backgroundColor: colorMain,
        color: "#e2e2e2",
        height: "55px",
        display: "flex",
        justifyContent: "space-between",
        padding: ".5rem 4rem",
      }}
    >
      <div style={{ flexGrow: 1 }} className="logo-container">
        <h1>
          <a href="/">News Blog</a>

          {!acc || acc.google != undefined ? (
            ""
          ) : (
            <>
              <button>
                <a href="/add">Add</a>
              </button>
              <button>
                <a href="/myarticles">My articles</a>
              </button>
            </>
          )}
        </h1>
      </div>

      <div>{!acc ? <div className="userarea">
        <a href="/login">Login as author</a> 
        <a href="/logingoogle" style={{color: 'yellow'}}>Join to reader</a> 
      </div> : <>
        {acc.name}
        <a href="/Logout" id="logout" style={{margin: '0 10px', color: '#000'}}>Logout</a>
      
      </>}</div>
    </div>
  );
}

export function SidebarApplication({articles, cats}) {

  return (
    <div
      style={{
        width: "30%",
        backgroundColor: colorMain,
        height: "100%",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        padding: ".5rem 4rem",
        float: "left",
      }}
    >
      <div className="topics-container">
        <div className="d-f">
          {cats.map((cat, index) => (
            <a href={`/topic/${cat}`} key={index}>
              {cat}
            </a>
          ))}
        </div>
      </div>

      <div className="d-f articlessidebar-container">
        {articles.length > 0 &&
          articles.map((article, index) => (
            <a key={`${article._id+article.slug+index}`} href={`/view/${article.slug}`}>
              {article.title}
            </a>
          ))}
      </div>
    </div>
  );
}

export function MainPage({articles}) {
  

  return (
    <div className="main">
      <div className="d-f articlessidebar-container">
        {articles.length > 0 &&
          articles.map((article, index) => (
            <div key={`${article._id+article.slug+index}`}>
              <a href={`/view/${article.slug}`}>{article.title}</a>
            </div>
          ))}
      </div>
    </div>
  );
}

export function ArticleSingle({account}) {
  if(account == undefined || account.email == undefined) {
    return <h1>Please login by google to read the article</h1>
  }
  const [values, setValues] = useState({
    title: "",
    text: "",
    date: "",
    category: "",
  });
  const { slug } = useParams();

  useEffect(async () => {
    await fetch(`/api/news/${slug}`).then((res) =>
      res.json().then((data) => setValues(data))
    );
  }, []);

  return (
    <div
      style={{
        width: "68%",
        float: "left",
        margin: "2% 0 0 2%",
      }}
    >
      <div className="d-f articlessidebar-container">
        <h1>{values.title}</h1>
        <span>Date {values.date}</span>

        <div className="d-f">
          <a href={`/topic/${values.category}`}>{values.category}</a>
        </div>

        <p>{values.text}</p>
      </div>
    </div>
  );
}

export function AddNewArticle({ account, ws }) {
  if (account == undefined || account.email == undefined || account.google != undefined) {
    return <h1>Please Login</h1>;
  }
  const navigate = useNavigate();
  const [values, setValues] = useState({});
  const onChange = (e) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };
  const cats = getCats();
  const onAddNewArticle = async (e) => {
    e.preventDefault();
    const res = await fetch("/api/news/add", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ ...values, author: account.email }),
    });
    if (res.ok) {
      ws.send('{"message":"update"}')
      toast.success("Your article added successfully");
      navigate("/myarticles");
    } else {
      toast.error(
        `Failed, ${res.status == 400 ? "Title is used" : res.statusText}`
      );
    }
  };
  return (
    <form onSubmit={onAddNewArticle}>
      <div>
        <label>Title</label>
        <input name="title" onChange={onChange} required />
      </div>

      <div>
        <label>Text</label>
        <textarea name="text" onChange={onChange} cols="30" rows="4" required />
      </div>

      <div>
        <label>Category</label>
        <select name="category" onChange={onChange} required>
          <option value="">--choose--</option>
          {cats.map((cat, index) => (
            <option value={cat} key={index}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div>
        <input type="submit" value="Add" />
      </div>
    </form>
  );
}

export function EditArticle({ account, ws }) {
  if (account == undefined || account.email == undefined || account.google != undefined ) {
    return <h1>Please Login</h1>;
  }
  const [values, setValues] = useState({ title: "", text: "", category: "" });
  const { slug } = useParams();

  useEffect(async () => {
    await fetch(`/api/news/${slug}`).then((res) =>
      res.json().then((data) => setValues(data))
    );
  }, []);
  const navigate = useNavigate();

  const onChange = (e) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };
  const cats = getCats();
  const onEditArticle = async (e) => {
    e.preventDefault();
    const res = await fetch("/api/news/save", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ ...values, account: account.email }),
    });
    if (res.ok) {
      ws.send('{"message":"update"}')
      toast.success("Your article updated");
      navigate("/myarticles");
    } else {
      toast.error(
        `Failed, ${res.status == 400 ? "Title is used" : res.statusText}`
      );
    }
  };
  return (
    <form onSubmit={onEditArticle}>
      <div>
        <label>Title</label>
        <input name="title" onChange={onChange} value={values.title} required />
      </div>

      <div>
        <label>Text</label>
        <textarea
          name="text"
          onChange={onChange}
          cols="30"
          rows="4"
          required
          defaultValue={values.text}
        />
      </div>

      <div>
        <label>Category</label>
        <select
          name="category"
          onChange={onChange}
          value={values.category}
          required
        >
          <option value="">--choose--</option>
          {cats.map((cat, index) => (
            <option value={cat} key={index}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div>
        <input type="submit" value="Save" />
      </div>
    </form>
  );
}

export function AuthorArticles({ account }) {
  if (account == undefined || account.email == undefined || account.google != undefined ) {
    return <p>Please login</p>;
  }
  const [articles, setArticles] = useState([]);
  useEffect(async () => {
    if (account.email != undefined && articles.length <= 0) {
      await fetch("/api/news/?author=" + account.email)
        .then((res) => res.json())
        .then((res) => setArticles(res));
    }
  }, [account]);


  return (
    <div className="main">
      <h1>My Articles</h1>
      {articles.length > 0 &&
        articles.map((article) => (
          <div key={`${article._id}`}>
            <a href={`/view/${article.slug}`}>{article.title}</a>

            <a href={`/edit/${article.slug}`}>
              <button>Edit</button>
            </a>
          </div>
        ))}
    </div>
  );
}

export function TopicArticles() {
  const [articles, setArticles] = useState([]);
  const { topic } = useParams();

  useEffect(async () => {
    await fetch("/api/news/?topic=" + topic)
      .then((res) => res.json())
      .then((res) => setArticles(res));
  }, []);

  return (
    <div className="main">
      <h1>({topic}) Articles</h1>
      {articles.length > 0 &&
        articles.map((article, index) => (
          <div key={`${article._id+index}`}>
            <a href={`/view/${article.slug}`}>{article.title}</a>
          </div>
        ))}
    </div>
  );
}
