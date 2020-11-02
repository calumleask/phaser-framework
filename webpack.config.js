const path = require("path");

const BUILD_DIR = path.resolve(__dirname, "dist");
const SRC_DIR = path.resolve(__dirname, "src");

const config = {
  entry: {
    "phfw": SRC_DIR + "/index.ts"
  },

  output: {
    path: BUILD_DIR,
    filename: "[name].js",
    library: "phfw",
    libraryTarget: "umd"
  },

  module : {
    rules : [
      {
        test : /\.(js|ts)$/,
        include : SRC_DIR,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              "@babel/preset-env",
              "@babel/preset-typescript"
            ]
          }
        }
      }
    ]
  },

  resolve: {
    extensions: [".ts", ".js"]
  }
};

module.exports = config;
