// 生成路由文件

const path = require("path");
const fs = require("fs");

let fileOptions = {
  name: "name",
  path: "path",
  children: "children",
  // 父路由是否生成文件
  parentFolder: false,
  // 文件后缀名
  fileSuffix: "vue",
  // 是否是vue3
  isVue3: false,
  // css编译器
  cssCompiler: "css",
  // 是否有ts
  isTypeScript: true,
};
let basePath = "./";

/**
 * 生成Vue2模板的默认内容
 */
const vue2Template = `
    <script>
    export default {}
    </script>
    <template>
    <div><h1>[name]</h1></div>
    </template>
    <style lang="${fileOptions["cssCompiler"]}" scoped>
    </style>"
`;

/**
 * 生成Vue3模板的默认内容
 */
const vue3Template = `
    <script${fileOptions["isTypeScript"] ? 'lang="ts"' : ""}>
    </script>
    <template>
    <div><h1>[name]</h1></div>
    </template>
    <style lang="${fileOptions["cssCompiler"]}" scoped>
    </style>"
`;

/**
 * 生成JSX/TSX模板的默认内容
 */
const jsxTemplate = `
    const [name] = () => {
        return <><h1>[name]</h1></>    
    }
    export default [name]
`;

/**
 * 验证options参数是否能正确读取数组数据
 * @param {Array} files - 路由配置数组
 * @param {Object} options - 配置对象
 * @throws {Error} 当无法从数组中读取到对应的配置值时抛出错误
 */
const validateOptionsWithData = (files, options) => {
  if (!files || !files.length) {
    throw new Error("路由配置数组不能为空");
  }

  const testItem = files[0];
  const requiredKeys = ["name", "path", "children"];

  for (const key of requiredKeys) {
    const configKey = options[key];
    if (configKey && testItem[configKey] === undefined) {
      throw new Error(
        `无法通过配置的 ${key}: "${configKey}" 在数组中读取到对应的值，请检查配置是否正确`
      );
    }
  }
};

/**
 * 脚本生成路由文件
 * @param {string} filename 生成文件夹位置
 * @param {Array} files 文件数组对象
 * @param {Object} options 配置对象
 * options[content] 中使用[name]标识每个文件内容
 */
const pathFiles = (filename, files = [], options = null) => {
  validatorParams(options || {});
  // 添加新的验证
  validateOptionsWithData(files, options || fileOptions);

  const url = path.join(__dirname, filename);
  if (options) fileOptions = options;
  basePath = url;
  recursionCreateFile(files);
};

/**
 * 验证配置参数的合法性
 * @param {Object} params - 配置对象
 * @throws {Error} 当参数类型不符合要求时抛出错误
 */
const validatorParams = (params) => {
  let err = "";
  if (params) {
    for (const key in params) {
      if (key === "name" || key === "path" || key === "children")
        if (typeof params[key] !== "string")
          err = `${key}的类型错误,只支持string`;
      if (key === "parentFolder" || key === "isTypeScript")
        if (typeof params[key] !== "boolean")
          err = `${key}的类型错误,只支持boolean`;
      switch (key) {
        case "isVue3":
          const suffix1 = params["fileSuffix"];
          if (
            (suffix1 === ".vue" || suffix1 === "vue") &&
            typeof params[key] !== "boolean"
          )
            err = `${key}的类型错误,只支持boolean`;
          break;
        case "fileSuffix":
          const suffix2 = params["fileSuffix"];
          if (
            suffix2 !== ".vue" &&
            suffix2 !== "vue" &&
            suffix2 !== ".jsx" &&
            suffix2 !== "jsx" &&
            suffix2 !== ".tsx" &&
            suffix2 !== "tsx"
          )
            err = `${key}的类型错误,只支持(vue|jsx|tsx|.jsx|.tsx)`;
          break;
        case "cssCompiler":
          const suffix3 = params["fileSuffix"];
          const css = params[key];
          if (
            (suffix3 === ".vue" || suffix3 === "vue") &&
            css !== "css" &&
            css !== "less" &&
            css !== "scss"
          )
            err = `${key}的类型错误,只支持(css|less|scss)`;
          break;
      }
      if (err) throw Error(new Error(err));
      fileOptions[key] = params[key];
    }
  }
};

/**
 * 遍历生成文件
 * @param {Array} list 后端返回的路由数组
 * @param {string} defaultPath 可包含父路径
 */
const recursionCreateFile = (list, defaultPath = "") => {
  const { name, path, children, parentFolder } = fileOptions;
  for (const item of list) {
    if (item[children]) recursionCreateFile(item.children, item[path]);
    const paths = item[path].split("/");

    // 默认文件内容
    let fileContent = "";

    // 判断框架
    let suffix = fileOptions["fileSuffix"].split(".").join("");
    switch (suffix) {
      case "vue":
        fileContent = vue2Template;
        if (fileOptions["isVue3"]) fileContent = vue3Template;
        break;
      case "jsx":
        fileContent = jsxTemplate;
        break;
      case "tsx":
        fileContent = jsxTemplate;
        break;
      default:
        console.err("您输入的后缀名有问题请使用jsx|tsx|vue等");
        return;
    }
    fileContent = fileContent.replace(
      /\[name\]/g,
      item[name] || paths[paths.length - 1]
    );

    // 父路由生成文件夹
    genrateFolder(item[parentFolder] ? paths : paths.slice(0, -1));
    // 父路由生成文件
    if (fileOptions[parentFolder] && item[children])
      genrateFile(paths, fileContent);
    // 生成文件
    if (!item[children]) genrateFile(paths, fileContent);
  }
};

/**
 * 生成文件夹
 * @param {Array<string>} paths 路径文件
 * @param {string} defaultPath 路由没有/开头默认拼接父级path
 */
const genrateFolder = (paths) => {
  const folderPath = path.join(basePath, paths.join("/"));
  fs.lstat(folderPath, (err) => {
    if (err) {
      fs.mkdir(folderPath, () => {
        console.log("文件夹生成成功", folderPath);
      });
    }
  });
};

/**
 * 生成文件
 * @param {Array<string>} paths 路径文件
 * @param {string} content 模板数据
 */
const genrateFile = (paths, content) => {
  const folderPath = path.join(basePath, paths.join("/"));
  const filename =
    folderPath +
    `${
      fileOptions["fileSuffix"].includes(".")
        ? fileOptions["fileSuffix"]
        : "." + fileOptions["fileSuffix"]
    }`;
  fs.lstat(filename, (err, e) => {
    if (err) {
      fs.writeFile(filename, content, "utf-8", () => {
        console.log("文件生成成功", filename);
      });
    }
  });
};

module.exports = pathFiles;
