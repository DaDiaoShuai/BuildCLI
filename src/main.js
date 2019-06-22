import chalk from "chalk";
import fs from "fs";
import ncp from "ncp";
import path from "path";
import { promisify } from "util";
import execa from "execa";
import Listr from "listr";
import { projectInstall } from "pkg-install";
import shelljs from "shelljs";

const access = promisify(fs.access);
const copy = promisify(ncp);

async function copyTemplateFiles(options) {
  // return copy(options.templateDirectory, options.targetDirectory, {
  //   clobber: false
  // });
  // TODO: 根据模板选项下载仓库
  shelljs.exec(
    "git clone https://github.com/DaDiaoShuai/BuildCLI.git"
  );
}

async function initGit(options) {
  const result = await execa("git", ["init"], {
    cwd: options.targetDirectory
  });
  if (result.failed) {
    return Promise.reject(new Error("Failed to initialize Git"));
  }
  return;
}

export async function createProject(options) {
  options = {
    ...options,
    targetDirectory: options.targetDirectory || process.cwd()
  };

  const currentFileUrl = import.meta.url;
  const templateDir = path.resolve(
    new URL(currentFileUrl).pathname,
    "../../templates",
    options.template.toLowerCase()
  );
  options.templateDirectory = templateDir;

  try {
    await access(templateDir, fs.constants.R_OK);
  } catch (error) {
    console.error("%s Invalid template name", chalk.red.bold("ERROR"));
    process.exit(1);
  }
  const tasks = new Listr([
    {
      title: "Copy Project files",
      task: () => copyTemplateFiles(options)
    },
    {
      title: "Iniitialize git",
      task: () => initGit(options),
      enabled: () => options.git
    },
    {
      title: "Install dependencies",
      task: () =>
        projectInstall({
          cwd: options.targetDirectory
        }),
      skip: () =>
        !options.runInstall
          ? "pass --install to automatically install"
          : undefined
    }
  ]);

  await tasks.run();

  console.log("%s Project ready", chalk.green.bold("DONE"));
  return true;
}
