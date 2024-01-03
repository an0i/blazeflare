// a?pis (#a#)(pp/)(ii/)(sss)
export function HashRoute(/**@type {string}*/ hash) {
  this.hash = hash;
}

HashRoute.prototype.getSegments = function () {
  if (this.getPrefixInfixSuffix() === "") return [];
  return this.isFolder() ? this.getPrefixInfixSuffix().slice(0, -1).split("/") : this.getPrefixInfixSuffix().split("/");
};

HashRoute.prototype.isFolder = function () {
  return this.hash.endsWith("/") || this.getPrefixInfixSuffix() === "";
};

HashRoute.prototype.getInfix = function (/**@type {HashRoute}*/ routeAsPrefix) {
  const is = this.getPrefixInfixSuffix().slice(routeAsPrefix.getPrefixInfixSuffix().length);
  const firstSlashIndex = is.indexOf("/");
  const i = firstSlashIndex === -1 ? is : is.slice(0, firstSlashIndex + 1);
  return i;
};

HashRoute.prototype.getPrefixInfixSuffix = function () {
  return this.hash.slice(this.hash.indexOf("#", 1) + 1);
};

HashRoute.prototype.getAction = function () {
  return this.hash.slice(0, this.hash.indexOf("#", 1) + 1);
};

export function formatBytes(/** @type number */ bytes, /** @type number */ decimals) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals || 2;
  const sizes = ["Bytes", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`;
}
