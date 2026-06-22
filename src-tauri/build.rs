fn main() {
    if let Ok(env_iter) = dotenvy::dotenv_iter() {
        for item in env_iter {
            if let Ok((key, val)) = item {
                println!("cargo:rustc-env={}={}", key, val);
            }
        }
    }

    println!("cargo:rerun-if-changed=.env");

    tauri_build::build()
}