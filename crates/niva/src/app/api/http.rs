use anyhow::Result;
use base64; 
use niva_macros::niva_api;
use serde::Deserialize;
use serde_json::{json, Value};
use std::{collections::HashMap, io::Read, sync::Arc};

use crate::app::api_manager::ApiManager;

pub fn register_api_instances(api_manager: &mut ApiManager) {
    api_manager.register_async_api("http.fetch", fetch);
}

type Headers = HashMap<String, String>;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct FetchOptions {
    pub url: String,
    #[serde(default = "default_method")]
    pub method: String,
    #[serde(default)]
    pub headers: Headers,
    #[serde(default)]
    pub body: Option<String>,
    #[serde(default)]
    pub proxy: Option<String>,
    #[serde(default = "default_response_type")]
    pub response_type: String,
}

fn default_method() -> String {
    "GET".to_string()
}

fn default_response_type() -> String {
    "text".to_string()
}

#[niva_api]
fn fetch(options: FetchOptions) -> Result<Value> {
    let mut agent_builder =
        ureq::AgentBuilder::new().tls_connector(Arc::new(native_tls::TlsConnector::new()?));

    if let Some(proxy) = &options.proxy {
        let proxy = ureq::Proxy::new(proxy)?;
        agent_builder = agent_builder.proxy(proxy);
    }

    let agent = agent_builder.build();
    let method = options.method.to_uppercase();
    let mut http_request = agent.request(&method, &options.url);

    // 设置请求头
    for (key, value) in &options.headers {
        http_request = http_request.set(key, value);
    }

    // 发送请求
    let http_response = match &options.body {
        Some(body) => http_request.send_string(body)?,
        None => http_request.call()?,
    };

    // 获取响应信息
    let status = http_response.status();
    let status_text = http_response.status_text().to_string();
    let mut response_headers = HashMap::new();
    
    for name in http_response.headers_names() {
        if let Some(value) = http_response.header(&name) {
            response_headers.insert(name, value.to_string());
        }
    }

    // 处理响应体
    let response = if options.response_type == "binary" {
        let mut reader = http_response.into_reader();
        let mut bytes = Vec::new();
        reader.read_to_end(&mut bytes)?;
        
        json!({
            "body": base64::encode(&bytes),
            "bodyType": "base64"
        })
    } else {
        json!({
            "body": http_response.into_string()?,
            "bodyType": "text"
        })
    };

    Ok(json!({
        "status": status,
        "statusText": status_text,
        "ok": status >= 200 && status < 300,
        "headers": response_headers,
        "url": options.url, 
        "response": response
    }))
}
