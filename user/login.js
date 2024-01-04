import Cookies from "js-cookie";
import * as jose from "jose";
const usp = new URLSearchParams(location.hash.slice(1));
const id_token = usp.get("id_token");
if (id_token === null) {
  window.localStorage.setItem("nonce", randomString(16));
  const auth0 = `https://an0iauth0.us.auth0.com/authorize?audience=https://blazeflare.anqi.eu.org/api&scope=openid%20profile&response_type=id_token&client_id=4QZZE81TKbdgTdmCOWZZQWnBZj4mZjH0&redirect_uri=https://blazeflare.anqi.eu.org/user/login.html&state=STATE&nonce=${window.localStorage.getItem("nonce")}`;
  location.href = auth0;
} else {
  const jwt = jose.decodeJwt(id_token);
  if (window.localStorage.getItem("nonce") !== jwt.nonce) alert("重放攻击?");
  Cookies.set("id_token", id_token, { expires: 36000000 / 86400000 });
  window.localStorage.setItem("user_info", JSON.stringify(jwt));
  location.href = import.meta.env.BASE_URL;
}

function randomString(length) {
  let charset = "0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz+/";
  let result = "";

  while (length > 0) {
    let bytes = new Uint8Array(16);
    let random = window.crypto.getRandomValues(bytes);

    random.forEach(function (c) {
      if (length == 0) {
        return;
      }
      if (c < charset.length) {
        result += charset[c];
        length--;
      }
    });
  }
  return result;
}
