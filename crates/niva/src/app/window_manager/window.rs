use crate::{app::menu::options::MenuOptions, lock_force};

use anyhow::{anyhow, Result};
use std::{
    ops::Deref,
    sync::{Arc, Mutex},
};

use serde::{Deserialize, Serialize};
use serde_json::json;
use tao::{
    event_loop::ControlFlow,
    window::{Window, WindowId},
};
use wry::webview::{WebContext, WebView};

use crate::{
    app::{
        utils::{arc, arc_mut, ArcMut},
        NivaApp, NivaEvent, NivaEventLoopProxy, NivaWindowTarget,
    },
    unsafe_impl_sync_send,
};

use super::{
    builder::NivaBuilder,
    options::{NivaWindowOptions, WindowMenuOptions},
    WindowManager,
};

pub struct NivaWindowState {
    pub is_block_closed_requested: bool,
}

pub struct NivaWindow {
    pub id: u16,
    pub window_id: WindowId,
    pub webview: WebView,
    pub menu_options: ArcMut<Option<WindowMenuOptions>>,
    app: Arc<NivaApp>,
    event_loop_proxy: NivaEventLoopProxy,

    pub state: Mutex<NivaWindowState>,
}

unsafe_impl_sync_send!(NivaWindow);
impl Deref for NivaWindow {
    type Target = Window;
    fn deref(&self) -> &Self::Target {
        self.webview.window()
    }
}

impl NivaWindow {
    pub fn new(
        app: Arc<NivaApp>,
        manager: &mut WindowManager,
        id: u16,
        options: &NivaWindowOptions,
        target: &NivaWindowTarget,
    ) -> Result<Arc<NivaWindow>> {
        let window = NivaBuilder::build_window(&app, manager, id, options, target)?;
        let webview = NivaBuilder::build_webview(&app, options, window, &mut manager.web_context)?;

        Ok(arc(Self {
            app: app.clone(),
            id,
            window_id: webview.window().id(),
            webview,
            menu_options: arc_mut(options.menu.clone()),
            event_loop_proxy: app.event_loop_proxy.clone(),

            state: Mutex::new(NivaWindowState {
                is_block_closed_requested: false,
            }),
        }))
    }

    #[cfg(target_os = "macos")]
    pub fn switch_menu(self: &Arc<Self>) {
        let menu_options = lock_force!(self.menu_options);
        self.webview
            .window()
            .set_menu(NivaBuilder::build_menu(self.id, &self.app, &menu_options));
    }

    pub fn set_menu(self: &Arc<Self>, options: &Option<WindowMenuOptions>) {
        let mut menu_options = lock_force!(self.menu_options);
        *menu_options = options.clone();
        if self.is_focused() && self.is_menu_visible() {
            self.webview
                .window()
                .set_menu(NivaBuilder::build_menu(self.id, &self.app, &menu_options));
        }
    }

    pub fn send_event<F: Fn(&NivaWindowTarget, &mut ControlFlow) -> Result<()> + Send + 'static>(
        self: &Arc<Self>,
        f: F,
    ) -> Result<()> {
        self.event_loop_proxy
            .send_event(NivaEvent::new(f))
            .map_err(|_| anyhow!("Failed to send event"))
    }

    pub fn send_ipc_event<E: Into<String>, P: Serialize>(
        self: &Arc<Self>,
        event: E,
        payload: P,
    ) -> Result<()> {
        let event: String = event.into();
        let payload = serde_json::to_string(&payload)?;
        let _self = self.clone();
        self.send_event(move |_, _| {
            _self
                .webview
                .evaluate_script(&format!("Niva.__emit__(\"{event}\", {payload})"))?;
            Ok(())
        })
    }

    pub fn send_ipc_callback<D: Serialize>(self: &Arc<Self>, data: D) -> Result<()> {
        self.send_ipc_event("ipc.callback", json!(data))
    }
}
