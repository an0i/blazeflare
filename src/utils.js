// a?pis (#a#)(pp/)(ii/)(sss)
export class Hash {
  constructor(/**@type {string}*/ value) {
    this.value = value;
  }
  getSegments() {
    if (this.getPrefixInfixSuffix() === "") return [];
    return this.isFolder() ? this.getPrefixInfixSuffix().slice(0, -1).split("/") : this.getPrefixInfixSuffix().split("/");
  }
  isFolder() {
    return this.value.endsWith("/") || this.getPrefixInfixSuffix() === "";
  }
  getInfix(/**@type {Hash}*/ routeAsPrefix) {
    const is = this.getPrefixInfixSuffix().slice(routeAsPrefix.getPrefixInfixSuffix().length);
    const firstSlashIndex = is.indexOf("/");
    const i = firstSlashIndex === -1 ? is : is.slice(0, firstSlashIndex + 1);
    return i;
  }
  getPrefixInfixSuffix() {
    return this.value.slice(this.value.indexOf("#", 1) + 1);
  }
  getAction() {
    return this.value.slice(0, this.value.indexOf("#", 1) + 1);
  }
}

export function formatBytes(/** @type number */ bytes, /** @type number */ decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals;
  const sizes = ["Bytes", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`;
}
