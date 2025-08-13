# 网络 http

## Niva.api.http.fetch

```ts
/**
 * 发送 HTTP(s) 请求并返回响应结果，模仿浏览器原生 fetch API 的行为
 * @param options 请求选项，包括 URL、方法、请求头、请求体、代理和响应类型
 * @returns 一个 Promise，在接收响应成功后解析该 Promise，或在发生错误时拒绝该 Promise。
 *          成功时返回一个包含完整响应信息的对象
 */
export function fetch(options: {
  /** 请求的 URL */
  url: string;

  /**
   * 请求方法 (GET, POST, PUT, DELETE 等)
   * @default 'GET'
   */
  method?: string;

  /**
   * 请求头对象
   * @default {}
   */
  headers?: { [key: string]: string };

  /** 请求体内容 */
  body?: string;

  /** 代理服务器地址 */
  proxy?: string;

  /**
   * 响应类型
   * - 'text': 返回文本内容
   * - 'binary': 返回 base64 编码的二进制数据
   * @default 'text'
   */
  responseType?: "text" | "binary";
}): Promise<{
  /** HTTP 状态码 */
  status: number;

  /** HTTP 状态文本 */
  statusText: string;

  /** 表示请求是否成功 (状态码在 200-299 范围内) */
  ok: boolean;

  /** 响应头对象 */
  headers: { [key: string]: string };

  /** 最终请求的 URL (考虑重定向) */
  url: string;

  /** 响应内容 */
  response: {
    /**
     * 响应体内容
     * - 当 responseType 为 'text' 时: 字符串文本
     * - 当 responseType 为 'binary' 时: base64 编码的字符串
     */
    body: string;

    /** 响应体类型标识 */
    bodyType: "text" | "base64";
  };
}>;
```
