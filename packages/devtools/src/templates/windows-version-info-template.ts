import { parseVersion } from "../common/utils";

// 添加缺失的字段并确保格式正确
export function versionInfoTemplate(config: any) {
  const version = config.meta?.version || "1.0.0.0";
  const numberVersion = parseVersion(version).join(",");
  
  // 添加资源标识符 '1 VERSIONINFO'
  return `1 VERSIONINFO
FILEVERSION ${numberVersion}
PRODUCTVERSION ${numberVersion}
FILEOS 0x40004
FILETYPE 0x1
{
  BLOCK "StringFileInfo"
  {
    BLOCK "040904b0"
    {
      VALUE "CompanyName", "${config.meta?.companyName || ""}"
      VALUE "FileDescription", "${config.meta?.description || ""}"
      VALUE "FileVersion", "${version}"
      VALUE "InternalName", "${config.name || "niva.exe"}"
      VALUE "LegalCopyright", "${config.meta?.copyright || ""}"
      VALUE "OriginalFilename", "${config.name || "niva.exe"}"
      VALUE "ProductName", "${config.name}"
      VALUE "ProductVersion", "${version}"
    }
  }
  BLOCK "VarFileInfo"
  {
    VALUE "Translation", 0x0409 0x04B0
  }
}`;
}
