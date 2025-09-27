export const getSharp = async () => {
  // see https://github.com/vercel/vercel/issues/14001
  return import("@img/sharp-wasm32").then((sharp) => sharp.default);
};
