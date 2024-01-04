import Cookies from "js-cookie";
Cookies.remove("id_token");
window.localStorage.clear();
location.href = import.meta.env.BASE_URL;
