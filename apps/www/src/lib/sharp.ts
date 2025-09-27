export const getSharp = async () => {
  return import("@img/sharp-wasm32").then((sharp) => sharp.default);
};
