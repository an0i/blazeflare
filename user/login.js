import Cookies from "js-cookie";
import * as jose from "jose";

const config = {
  auth0CustomDomain: "an0iauth0.us.auth0.com",
  auth0Audience: "https://blazeflare.anqi.eu.org/api",
  auth0ClientId: "4QZZE81TKbdgTdmCOWZZQWnBZj4mZjH0",
  auth0RedirectUri: `${import.meta.env.DEV ? "http://127.0.0.1:8788" : "https://blazeflare.anqi.eu.org"}${import.meta.env.BASE_URL}user/login.html`,
  loginNoPrompt: false,
};

const urlSearchParams = new URLSearchParams(window.location.hash.slice(1));
const id_token = urlSearchParams.get("id_token");
if (id_token === null) {
  window.localStorage.setItem("nonce", randomString(16));
  window.location.href = `https://${config.auth0CustomDomain}/authorize?${new URLSearchParams({
    audience: config.auth0Audience,
    client_id: config.auth0ClientId,
    redirect_uri: config.auth0RedirectUri,
    scope: "openid profile",
    response_type: "id_token",
    state: "STATE",
    nonce: window.localStorage.getItem("nonce"),
  })}`;
} else {
  const jwt = jose.decodeJwt(id_token);
  if (window.localStorage.getItem("nonce") !== jwt.nonce) alert("重放攻击?");
  Cookies.set("id_token", id_token, { expires: 36000000 / 86400000 });
  window.localStorage.setItem("user_info", JSON.stringify(jwt));
  window.location.href = import.meta.env.BASE_URL;
}

function randomString(/**@type {number}*/ length) {
  let charset = "0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz+/";
  let result = "";
  while (length > 0) {
    let bytes = new Uint8Array(16);
    let random = window.crypto.getRandomValues(bytes);
    random.forEach(function (c) {
      if (length == 0) return;
      if (c < charset.length) {
        result += charset[c];
        length--;
      }
    });
  }
  return result;
}
