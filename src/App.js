import WithMessage from "./hocs/withMessage";
import React, { useEffect, useContext } from "react";
import { useState } from "react";
import { AppContext } from "./context/AppProvider";
import jwt from "jsonwebtoken";
import { getAccountByHomeAccountId } from "./util/auth";

// Router
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
} from "react-router-dom";

// Policy
import Policy from "./components/policy";
// Pages
import Login from "./pages/login";
import Admin from "./pages/admin";
import Files from "./pages/files";
import LoginAdmin from "./pages/loginAdmin";
import NotFoundPage from "./pages/404";
import Photos from "./pages/photos";
import Videos from "./pages/videos";
import Shared from "./pages/shared";
import Syncronization from "./pages/sync";

// Auth utils
import { getLocalSesion } from "./util/auth";
import isElectron from "is-electron";

// SHow when sesion is loading
const Loading = () => <div className="fixed-top">Loading...</div>;
const { ipcRenderer } = window;

// Denied access if not exists a sesion as user
const PrivateRoute = ({ children, sesion, loadingSesion, ...rest }) => {
  // Loading sesion
  if (loadingSesion) return <Route {...rest} render={() => <Loading />} />;

  // If not exist  sesion
  if (!sesion && !loadingSesion)
    return (
      <Route
        {...rest}
        render={({ location }) => {
          if (location.pathname === "/admin")
            return <Redirect to="/admin/login" />;
          else return <Redirect to="/login" />;
        }}
      />
    );

  /* Avoid user enter into admin page
     and avoid admin enter into user pages
  */
  return (
    <Route
      {...rest}
      render={({ location }) => {
        if (location.pathname === "/admin" && sesion.role !== "ADMIN")
          return <Redirect to="/login" />;
        else if (location.pathname !== "/admin" && sesion.role === "ADMIN")
          return <Redirect to="/admin/login" />;
        else return children;
      }}
    />
  );
};

// Denied load user login page when exist a sesion
const ProtectedAccessUserLoginRoute = ({
  children,
  sesion,
  loadingSesion,
  ...rest
}) => {
  // Loading sesion
  if (loadingSesion) return <Route {...rest} render={() => <Loading />} />;

  // If  exist  sesion redict to initial user page
  if (sesion)
    return (
      <Route
        {...rest}
        render={() => {
          if (sesion.role === "ADMIN") return <Redirect to="/admin" />;
          else return <Redirect to="/" />;
        }}
      />
    );
  else if (!sesion && !loadingSesion)
    return <Route {...rest} render={() => children} />;
};

// Denied load user login page when exist a sesion
const ProtectedAccessAdminLoginRoute = ({
  children,
  sesion,
  loadingSesion,
  ...rest
}) => {
  // Loading sesion
  if (loadingSesion) return <Route {...rest} render={() => <Loading />} />;

  // If  exist  sesion redict to initial admin page
  if (sesion)
    return (
      <Route
        {...rest}
        render={() => {
          if (sesion.role === "USER") return <Redirect to="/" />;
          else return <Redirect to="/admin" />;
        }}
      />
    );
  else if (!sesion && !loadingSesion)
    return <Route {...rest} render={() => children} />;
};

function App({ showMessage }) {
  // Get context
  const [sesion, setSesion, setUser] = useContext(AppContext);
  const [loadingSesion, setLoadingSesion] = useState(true);

  // check status red
  const alertOnlineStatus = () => { 
    if(navigator.onLine){
     if(isElectron()){
      ipcRenderer.send("resume-sync", null);
     }
      showMessage("Online")
    }else{
      if(isElectron()){
        ipcRenderer.send("sync-offline", null);
      }
      showMessage("Offline", "warning")
    }
   }
  
  useEffect(() => {
    console.log("Render App");

    window.addEventListener('online', alertOnlineStatus)
    window.addEventListener('offline', alertOnlineStatus)

    // Get sesion and set context
    getLocalSesion()
      .then(async (auth) => {
        setSesion(auth);

        // set  global listeners for show messages
        if (isElectron()) {
          ipcRenderer.on("sync-error", (event, message) => {
            showMessage(message, "error");
          });

          ipcRenderer.on("sync-change", (event, message) => {
            showMessage(message);
          });
        }

        // if exist a user authenticate set to context
        if (auth) {
          if (auth.role === "ADMIN") {
            const userAuthenticated = jwt.decode(auth.token);
            setUser({ username: userAuthenticated.name });
          } else if (auth.role === "USER") {
            const userAuthenticated = await getAccountByHomeAccountId();
            const username = userAuthenticated.name
              .replace(/\s/g, "-")
              .toLowerCase();
            setUser({ username });

            // SET TOKEN INTO ELECTRON STORAGE
            if (isElectron()) {
              const { token } = auth;
              ipcRenderer.send("set-auth", token);

              // resume sync if dir synced exist
              ipcRenderer.send("resume-sync", null);
              
            }
          }
        }
        setLoadingSesion(false);
      })
      .catch(() => showMessage("Invalid sesión", "error"));
  }, []);

  return (
    <React.StrictMode>
      <Policy />
      <Router>
        <Switch>
          <PrivateRoute
            sesion={sesion}
            loadingSesion={loadingSesion}
            exact
            path="/"
          >
            <Files />
          </PrivateRoute>

          <PrivateRoute
            sesion={sesion}
            loadingSesion={loadingSesion}
            exact
            path="/photos"
          >
            <Photos />
          </PrivateRoute>

          <PrivateRoute
            sesion={sesion}
            loadingSesion={loadingSesion}
            exact
            path="/videos"
          >
            <Videos />
          </PrivateRoute>

          <PrivateRoute
            sesion={sesion}
            loadingSesion={loadingSesion}
            exact
            path="/syncronization"
          >
            <Syncronization />
          </PrivateRoute>

          <PrivateRoute
            sesion={sesion}
            loadingSesion={loadingSesion}
            exact
            path="/shared"
          >
            <Shared />
          </PrivateRoute>

          <PrivateRoute
            sesion={sesion}
            loadingSesion={loadingSesion}
            exact
            path="/admin"
          >
            <Admin />
          </PrivateRoute>

          <ProtectedAccessUserLoginRoute
            sesion={sesion}
            loadingSesion={loadingSesion}
            exact
            path="/login"
          >
            <Login />
          </ProtectedAccessUserLoginRoute>

          <ProtectedAccessAdminLoginRoute
            sesion={sesion}
            loadingSesion={loadingSesion}
            exact
            path="/admin/login"
          >
            <LoginAdmin />
          </ProtectedAccessAdminLoginRoute>

          <Route exact path="/404">
            <NotFoundPage />
          </Route>

          <Redirect to="/404" />
        </Switch>
      </Router>
    </React.StrictMode>
  );
}

export default WithMessage(App);
