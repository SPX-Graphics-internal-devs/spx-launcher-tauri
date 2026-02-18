use std::env;
use std::io::BufRead;
use std::process::{Child, Command};
use tauri::Emitter;
use std::sync::Mutex;
use tauri::State;
use tauri::AppHandle;
use std::fs;
use tauri::Manager;
use std::path::PathBuf;

struct ServerState {
    child: Mutex<Option<Child>>,
}

struct AppConfig {
    port: String,
}

fn parse_port_from_args() -> String {
    let args: Vec<String> = env::args().collect();
    // First arg is the executable, second would be our port
    if args.len() > 1 {
        // Validate it's a valid port number
        if let Ok(port_num) = args[1].parse::<u16>() {
            return port_num.to_string();
        }
    }
    "5660".to_string() // Default port
}

fn create_working_directory(app: &AppHandle) -> Result<PathBuf, String> {
    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    fs::create_dir_all(&data_dir).map_err(|e| e.to_string())?;
    Ok(data_dir)
}

#[tauri::command]
fn get_port(config: State<AppConfig>) -> String {
    config.port.clone()
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

//TODO: Notify user that closing the app will not kill the server process

#[tauri::command]
fn launch_server(app: tauri::AppHandle, state: State<ServerState>) -> Result<String, String> {
    let mut server_child = state.child.lock().map_err(|e| e.to_string())?;

    if server_child.is_some() {
        return Ok("Server is already running".to_string());
    }

    // Determine path to the server binary
    // Assumption:
    // macOS Bundle: App.app/Contents/MacOS/App -> We want App.app/../spx-server
    // Windows/Linux: ./App -> We want ./spx-server
    // Dev: ./src-tauri/target/debug/App -> We want ./spx-server (project root? or target dir?)

    let exe_path = env::current_exe().map_err(|e| e.to_string())?;
    let mut server_path = exe_path.parent().unwrap().to_path_buf();

    #[cfg(target_os = "macos")]
    {
        // If we are in a bundle (Contents/MacOS), go up 3 levels to get out of .app
        if server_path.ends_with("Contents/MacOS") {
             server_path.push("../../../");
        }
    }

    #[cfg(target_os = "linux")]
    {
        server_path = create_working_directory(&app)?;
    }
    
    server_path.push("spx-server");
    
    // Fallback for dev environment if not found next to exe
    if !server_path.exists() {
         // Try to find it in the project root relative to where we might be running?
         // This is tricky in dev, so let's just log what we tried.
         println!("Server binary not found at: {:?}", server_path);
         // Optionally try a hardcoded dev path if you have one, e.g.
         // server_path = PathBuf::from("../spx-server");
    }

    println!("Attempting to launch server at: {:?}", server_path);

    let server_dir = server_path.parent().expect("Failed to get server directory");
    println!("Setting current directory to: {:?}", server_dir);

    let mut child = Command::new(&server_path)
        .current_dir(server_dir)
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to launch server at {:?}: {}", server_path, e))?;

    let stdout = child.stdout.take().ok_or("Failed to open stdout")?;
    let stderr = child.stderr.take().ok_or("Failed to open stderr")?;

    let app_handle = app.clone();
    std::thread::spawn(move || {
        let reader = std::io::BufReader::new(stdout);
        for line in reader.lines() {
            if let Ok(line) = line {
                let _ = app_handle.emit("server-log", line);
            }
        }
    });

    let app_handle = app.clone();
    std::thread::spawn(move || {
        let reader = std::io::BufReader::new(stderr);
        for line in reader.lines() {
            if let Ok(line) = line {
                let _ = app_handle.emit("server-log", line);
            }
        }
    });

    *server_child = Some(child);

    Ok("Server is running".to_string())
}

#[tauri::command]
fn stop_server(state: State<ServerState>) -> Result<String, String> {
    let mut server_child = state.child.lock().map_err(|e| e.to_string())?;

    if let Some(mut child) = server_child.take() {
        child.kill().map_err(|e| e.to_string())?;
        Ok("Server stopped".to_string())
    } else {
        Ok("Server was not running".to_string())
    }
}

#[tauri::command]
fn open_logs_folder() -> Result<(), String> {
    let exe_path = env::current_exe().map_err(|e| e.to_string())?;
    let mut logs_path = exe_path.parent().unwrap().to_path_buf();

    #[cfg(target_os = "macos")]
    {
        // If we are in a bundle (Contents/MacOS), go up 3 levels to get out of .app
        if logs_path.ends_with("Contents/MacOS") {
            logs_path.push("../../../");
        }
    }

    logs_path.push("LOG");
    
    // Canonicalize to resolve any .. in the path
    let logs_path = logs_path.canonicalize().unwrap_or(logs_path);
    
    println!("Opening logs folder at: {:?}", logs_path);

    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg(&logs_path)
            .spawn()
            .map_err(|e| format!("Failed to open logs folder: {}", e))?;
    }

    #[cfg(target_os = "windows")]
    {
        Command::new("explorer")
            .arg(&logs_path)
            .spawn()
            .map_err(|e| format!("Failed to open logs folder: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        Command::new("xdg-open")
            .arg(&logs_path)
            .spawn()
            .map_err(|e| format!("Failed to open logs folder: {}", e))?;
    }

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let port = parse_port_from_args();
    
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(ServerState {
            child: Mutex::new(None),
        })
        .manage(AppConfig { port })
        .invoke_handler(tauri::generate_handler![launch_server, stop_server, get_port, open_logs_folder])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
