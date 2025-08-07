import * as path from "node:path";
import { defineConfig } from "@rspack/cli";
import {DefinePlugin, rspack} from "@rspack/core";
import * as RefreshPlugin from "@rspack/plugin-react-refresh";
import { ModuleFederationPlugin } from "@module-federation/enhanced/rspack";

import * as dotenv from "dotenv";
dotenv.config();

import { mfConfig } from "./module-federation.config";

const isDev = process.env.NODE_ENV === "development";

// Target browsers, see: https://github.com/browserslist/browserslist
const targets = ["chrome >= 87", "edge >= 88", "firefox >= 78", "safari >= 14"];

export default defineConfig({
  context: __dirname,
  entry: {
    main: "./src/index.tsx",
  },
  resolve: {
    extensions: ["...", ".ts", ".tsx", ".jsx"],
  },

  devServer: {
    port: 3000,
    historyApiFallback: true,
    watchFiles: [path.resolve(__dirname, "src")],
  },
  output: {
    // You need to set a unique value that is not equal to other applications
    uniqueName: "react_s3_experiment",
    // publicPath must be configured if using manifest
    publicPath: `${process.env.REACT_S3_SERVICE}`,
  },

  experiments: {
    css: true,
  },

  module: {
    rules: [
      {
        test: /\.svg$/,
        type: "asset",
      },
      {
        test: /\.css$/,
        use: ["postcss-loader"],
        type: "css",
      },
      {
        test: /\.(jsx?|tsx?)$/,
        use: [
          {
            loader: "builtin:swc-loader",
            options: {
              jsc: {
                parser: {
                  syntax: "typescript",
                  tsx: true,
                },
                transform: {
                  react: {
                    runtime: "automatic",
                    development: isDev,
                    refresh: isDev,
                  },
                },
              },
              env: { targets },
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new rspack.HtmlRspackPlugin({
      template: "./index.html",
    }),
    new DefinePlugin({
      "process.env.REACT_APP_S3_REGION": JSON.stringify(process.env.REACT_APP_S3_REGION),
      "process.env.REACT_APP_S3_BUCKET": JSON.stringify(process.env.REACT_APP_S3_BUCKET),
      "process.env.REACT_APP_S3_ACCESS_KEY": JSON.stringify(process.env.REACT_APP_S3_ACCESS_KEY),
      "process.env.REACT_APP_S3_SECRET_KEY": JSON.stringify(process.env.REACT_APP_S3_SECRET_KEY),
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
    }),
    new ModuleFederationPlugin(mfConfig),
    isDev ? new RefreshPlugin() : null,
  ].filter(Boolean),
  optimization: {
    minimizer: [
      new rspack.SwcJsMinimizerRspackPlugin(),
      new rspack.LightningCssMinimizerRspackPlugin({
        minimizerOptions: { targets },
      }),
    ],
  },
});
