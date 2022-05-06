import React, { useContext, useEffect, useState } from "react";
import ReactDOM from "react-dom";
import {
  BrowserRouter,
  Link,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";

import {
  TopBar,
  MainPage,
  SidebarApplication,
  ArticleSingle,
  AddNewArticle,
  AuthorArticles,
  EditArticle,
  TopicArticles,
} from "./components";

import { fetchJSON, randomString, sha256, useLoader, getCats } from "./components/utils";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./css/reset.css";



const LoginContext = React.createContext(undefined);

function Login() {
  const { discovery_endpoint, client_id, scope } = useContext(LoginContext);
  useEffect(async () => {
    const { authorization_endpoint } = await fetchJSON(discovery_endpoint);

    const state = randomString(50);
    window.sessionStorage.setItem("authorization_state", state);
    const code_verifier = randomString(50);
    window.sessionStorage.setItem("code_verifier", code_verifier);

    const parameters = {
      response_type: "code",
      response_mode: "fragment",
      state,
      client_id,
      scope,
      code_challenge: await sha256(code_verifier),
      code_challenge_method: "S256",
      redirect_uri: window.location.origin + "/login/callback",
      domain_hint: "egms.no",
    };

    window.location.href =
      authorization_endpoint + "?" + new URLSearchParams(parameters);
  }, []);

  return (
    <div>
      <h1>Please wait....</h1>
    </div>
  );
}

function LoginCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState();
  const { discovery_endpoint, client_id } = useContext(LoginContext);
  useEffect(async () => {
    const { state, code, access_token, error, error_description } =
      Object.fromEntries(
        new URLSearchParams(window.location.hash.substring(1))
      );
    const expectedState = window.sessionStorage.getItem("authorization_state");
    if (state !== expectedState) {
      setError("Invalid callback - state mismatch");
    } else if (error || error_description) {
      setError(error_description || error);
    } else if (code) {
      const grant_type = "authorization_code";
      const code_verifier = window.sessionStorage.getItem("code_verifier");
      const redirect_uri = window.location.origin + "/login/callback";
      const { token_endpoint } = await fetchJSON(discovery_endpoint);
      const parameters = {
        client_id,
        grant_type,
        code,
        code_verifier,
        redirect_uri,
      };
      const tokenRes = await fetch(token_endpoint, {
        method: "post",
        body: new URLSearchParams(parameters),
      });
      if (!tokenRes.ok) {
        setError(
          `Failed to fetch token: ${tokenRes.status} ${tokenRes.statusText}`
        );
        console.log(await tokenRes.json());
      } else {
        setError(`Okay -- lets try to get the token from ${token_endpoint}!`);
        const { access_token } = await tokenRes.json();
        const res = await fetch("/api/login", {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({ access_token }),
        });
        if (res.ok) {
          window.location.replace(window.location.origin);
        } else {
          setError(`Failed ${res.status} ${res.statusText}`);
        }
      }
    } else if (access_token) {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ access_token }),
      });
      if (res.ok) {
        window.location.replace(window.location.origin);
      } else {
        setError(`Failed ${res.status} ${res.statusText}`);
      }
    } else {
      setError("Missing access_token");
    }
  }, []);

  if (error) {
    return (
      <div>
        <h1>Error</h1>
        <div>{error}</div>
        <div>
          <Link to={"/login"}>Try again</Link>
        </div>
      </div>
    );
  }

  return <h1>Please wait...</h1>;
}


function LoginGoogle() {

  async function handleStartLogin() {
    // Get the location of endpoints from Google
    const { authorization_endpoint } = await fetchJSON(
      "https://accounts.google.com/.well-known/openid-configuration"
    );

    // Tell Google how to authentication
    const query = new URLSearchParams({
      response_type: "token",
      scope: "openid profile email",
      client_id: process.env.CLIENT_GOOGLE_ID,
      // Tell user to come back to http://localhost:3000/callback when logged in
      redirect_uri: window.location.origin + "/login/callback/google",
    });
    // Redirect the browser to log in
    window.location.href = authorization_endpoint + "?" + query;
  }

  return (
    <div style={{display: 'table', margin: '4rem auto'}}>
      <button style={{padding: '10px 20px', fontSize: '1.2rem'}} onClick={handleStartLogin}>Google Login</button>
    </div>
  );
}


// Router should take user here on /callback
function LoginGoogleCallback() {
  const navigate = useNavigate();
  useEffect(async () => {
    const { access_token } = Object.fromEntries(
      new URLSearchParams(window.location.hash.substring(1))
    );
    console.log(access_token);

    await fetch("/api/logingoogle", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ access_token }),
    });
    navigate("/");
  });
  return <div>Completing loging...</div>;
}


function Logout({account}) {
  const navigate = useNavigate();
  useEffect(async () => {


    await fetch("/api/logout", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ account }),
    });
    document.cookie = "cookiename=access_token; expires = Thu, 01 Jan 1970 00:00:00 GMT";
    window.location.replace(window.location.origin)
  });
  return <h1>Please wait</h1>
  
}


function Application() {
  const { data, loading, error } = useLoader(() => fetchJSON("/api/config"));
  const [articles, setArticles] = useState([]);
  const [ws, setWs] = useState();
  const [account, setAccount] = useState({});
  const dataAccount = async () => {
    const data = await fetchJSON("/api/login");
    return data;
  };
  const dataGoogleAccount = async () => {
    const data = await fetchJSON("/api/logingoogle");
    return data;
  };
  useEffect(() => {
    dataAccount().then((data) => {
      console.log(data)
      setAccount({...data})
      if(data.email == undefined) {
        dataGoogleAccount().then((data) => setAccount({...data, google: true})).catch((err) => {
          console.log(err)
        });
      }
    });
    const ws = new WebSocket(window.location.origin.replace(/^http/, "ws"));

    ws.onmessage = (event) => {
      // console.log(event.data);
      const articles = JSON.parse(event.data);
      setArticles(articles);
    };
    setWs(ws);
  }, []);
  console.log(account);
  if (loading) {
    return <div>Please wait...</div>;
  }

  if (error) {
    return (
      <>
        <h1>Error</h1>
        <div>{error.toString()}</div>
      </>
    );
  }

  const { discovery_endpoint, client_id, scope } = data;


  const cats = getCats();
  return (
    <LoginContext.Provider value={{ discovery_endpoint, client_id, scope }}>
      <ToastContainer position="top-center" />
      <BrowserRouter>
        <TopBar account={account} />
        <SidebarApplication articles={articles} cats={cats} />

        <Routes>
          <Route path={"/"} element={<MainPage articles={articles} />} />
          <Route path={"/add"} element={<AddNewArticle account={account} ws={ws} />} />
          <Route
            path={"/myarticles"}
            element={<AuthorArticles account={account} />}
          />
          <Route path={"/view/:slug"} element={<ArticleSingle account={account} />} />
          <Route
            path={"/edit/:slug"}
            element={<EditArticle account={account} ws={ws} />}
          />
          <Route path={"/logout"} element={<Logout account={account} />} />

          <Route path={"/logingoogle"} element={<LoginGoogle />} />

          <Route path={"/login"} element={<Login />} />
          
          <Route path={"/login/callback"} element={<LoginCallback />} />
          <Route path={"/login/callback/google"} element={<LoginGoogleCallback />} />
          
          <Route path={"/topic/:topic"} element={<TopicArticles />} />
        </Routes>
      </BrowserRouter>
    </LoginContext.Provider>
  );
}

ReactDOM.render(<Application />, document.getElementById("app"));
