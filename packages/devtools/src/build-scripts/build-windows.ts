import pako from "pako";
import { pathJoin, runCmd, tempDirWith } from "../common/utils";
import {
  appendResource,
  arrayBufferToBase64,
  dataKey,
  indexesKey,
  packageResource,
} from "./base";
import { versionInfoTemplate } from "../templates/windows-version-info-template";
import type { BuildParams } from './base';

export async function buildWindowsApp(params: BuildParams): Promise<string> {
  const { project, file, progress } = params;
  const { process, fs, resource } = Niva.api;
  const { locale } = project.app.state;

  const currentExe = await process.currentExe();
  if (!file) {
    throw new Error(locale.t("UNSELECTED_EXE_FILE"));
  }

  const targetExe = file.endsWith(".exe") ? file : file + ".exe";
  const projectResourcePath = pathJoin(
    project.state.path,
    project.state.config.build?.resource
  );
  const buildPath = tempDirWith(
    `${project.state.name}_${project.state.uuid.slice(0, 8)}`
  );
  const indexesPath = pathJoin(buildPath, indexesKey);
  const dataPath = pathJoin(buildPath, dataKey);

  progress.addTask(locale.t("PREPARE_BUILD_ENVIRONMENT"), async () => {
    await fs.createDirAll(buildPath);
  });

  let fileIndexes: Record<string, [number, number]> = {};
  let buffer = new ArrayBuffer(0);
  progress.addTask(locale.t("PACKAGING_RESOURCES"), async () => {
    const initialResource = await appendResource(
      project.state.configPath,
      "niva.json"
    );
    const [_fileIndex, _buffer] = await packageResource(
      projectResourcePath,
      ...initialResource
    );
    fileIndexes = _fileIndex;
    buffer = _buffer;
  });

  progress.addTask(locale.t("COMPRESSING_RESOURCES"), async () => {
    const compressedBuffer = pako.deflateRaw(buffer).buffer;
    await Promise.all([
      fs.write(indexesPath, JSON.stringify(fileIndexes, null, 2)),
      fs.write(dataPath, arrayBufferToBase64(compressedBuffer), "base64"),
    ]);
  });

  progress.addTask(locale.t("GENERATING_ICON"), async () => {
    if (!project.state.config.icon) {
      return;
    }
    const iconPath = pathJoin(projectResourcePath, project.state.config.icon);
    await resource.extract(
      "windows/icon_creator.exe",
      pathJoin(buildPath, "icon_creator.exe")
    );
    await process.exec(pathJoin(buildPath, "icon_creator.exe"), [
      iconPath,
      pathJoin(buildPath, "icon.ico"),
    ],{silent: true});
  });

  // 生成版本信息文件
  const versionRcPath = pathJoin(buildPath, "version.rc");
  const versionResPath = pathJoin(buildPath, "version.res");
  
  progress.addTask(locale.t("GENERATING_VERSION_INFO"), async () => {
    await fs.write(versionRcPath, versionInfoTemplate(project.state.config));
  });

  // 提取并准备ResourceHacker
  let resourceHackerPath = "";
  progress.addTask(locale.t("PREPARING_RESOURCE_TOOLS"), async () => {
    resourceHackerPath = pathJoin(buildPath, "ResourceHacker.exe");
    await resource.extract(
      "windows/ResourceHacker.exe",
      resourceHackerPath
    );
  });

  // 编译版本信息资源
  progress.addTask(locale.t("COMPILING_VERSION_INFO"), async () => {
    await runCmd(resourceHackerPath, [
      "-open", versionRcPath,
      "-save", versionResPath,
      "-action", "compile",
      "-log", "NUL" 
    ]);
  });

  progress.addTask(locale.t("BUILD_EXECUTABLE_FILE"), async () => {
    const iconScript = project.state.config.icon ? `
-delete ICON,1,0
-delete ICON,2,0
-delete ICON,3,0
-delete ICON,4,0
-delete ICON,5,0
-delete ICON,6,0
-delete ICON,7,0

-addoverwrite "${pathJoin(buildPath, "icon.ico")}", ICONGROUP,1,1033
` : "";

    const script = `
[FILENAMES]
Exe=    "${currentExe}"
SaveAs= "${targetExe}"
Log=    "${pathJoin(buildPath, "ResourceHacker.log")}"
[COMMANDS]
-addoverwrite "${indexesPath}", RCDATA,${indexesKey},1033
-addoverwrite "${dataPath}", RCDATA,${dataKey},1033

${iconScript}`;

    await fs.write(pathJoin(buildPath, "bundle_script.txt"), script);

    try {
      await runCmd(resourceHackerPath, [
        "-script",
        pathJoin(buildPath, "bundle_script.txt"),
      ]);
    } catch (err) {
      await process.open(buildPath);
      throw new Error(`${locale.t("BUILD_FAILED")}: ${err.message}`);
    }

    await runCmd(resourceHackerPath, [
      "-open", targetExe,
      "-save", targetExe,
      "-action", "addoverwrite",
      "-res", versionResPath,
      "-mask", "VERSIONINFO"
    ]);
  });

  progress.addTask(locale.t("CLEAN_BUILD_ENVIRONMENT"), async () => {
    try {
      await fs.remove(buildPath);
    } catch (e) {
      console.warn("Clean build environment failed:", e);
    }
  });

  return targetExe;
}
