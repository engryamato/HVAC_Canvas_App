use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tiny_http::{Response, Server};
use url::Url;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct OAuthTokens {
    pub access_token: String,
    pub refresh_token: Option<String>,
    pub expires_in: u64,
    pub id_token: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GoogleUserInfo {
    pub sub: String,        // Google user ID
    pub email: String,
    pub name: String,
    pub picture: String,
    pub email_verified: bool,
}

/// Start OAuth flow with localhost callback server
#[tauri::command]
pub async fn start_google_oauth(
    client_id: String,
    client_secret: String,
) -> Result<OAuthTokens, String> {
    // Start temporary HTTP server on random port
    let server = Server::http("127.0.0.1:0")
        .map_err(|e| format!("Failed to start OAuth server: {}", e))?;

    let port = server.server_addr().port();
    let redirect_uri = format!("http://localhost:{}/callback", port);

    // Build Google OAuth URL
    let auth_url = format!(
        "https://accounts.google.com/o/oauth2/v2/auth?\
         client_id={}&\
         redirect_uri={}&\
         response_type=code&\
         scope=openid%20email%20profile&\
         access_type=offline&\
         prompt=consent",
        urlencoding::encode(&client_id),
        urlencoding::encode(&redirect_uri)
    );

    // Open browser to Google OAuth page
    println!("Opening browser to: {}", auth_url);
    open::that(&auth_url).map_err(|e| format!("Failed to open browser: {}", e))?;

    // Wait for callback from Google
    println!("Waiting for OAuth callback on port {}...", port);
    let request = server
        .recv()
        .map_err(|e| format!("Failed to receive callback: {}", e))?;

    // Extract authorization code from query params
    let url_str = format!("http://localhost{}", request.url());
    let url = Url::parse(&url_str).map_err(|e| format!("Invalid callback URL: {}", e))?;

    let code = url
        .query_pairs()
        .find(|(key, _)| key == "code")
        .map(|(_, value)| value.to_string())
        .ok_or("No authorization code in callback")?;

    // Check for error in callback
    if let Some((_, error)) = url.query_pairs().find(|(key, _)| key == "error") {
        return Err(format!("OAuth error: {}", error));
    }

    // Send success response to browser
    let html_response = r#"
        <!DOCTYPE html>
        <html>
        <head><title>Authentication Successful</title></head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
            <h1>✓ Authentication Successful</h1>
            <p>You can close this window and return to the app.</p>
            <script>window.close();</script>
        </body>
        </html>
    "#;
    let _ = request.respond(Response::from_string(html_response).with_status_code(200));

    // Exchange authorization code for tokens
    println!("Exchanging authorization code for tokens...");
    exchange_code_for_tokens(code, client_id, client_secret, redirect_uri).await
}

/// Exchange authorization code for OAuth tokens
async fn exchange_code_for_tokens(
    code: String,
    client_id: String,
    client_secret: String,
    redirect_uri: String,
) -> Result<OAuthTokens, String> {
    let client = reqwest::Client::new();

    let mut params = HashMap::new();
    params.insert("code", code);
    params.insert("client_id", client_id);
    params.insert("client_secret", client_secret);
    params.insert("redirect_uri", redirect_uri);
    params.insert("grant_type", "authorization_code".to_string());

    let response = client
        .post("https://oauth2.googleapis.com/token")
        .form(&params)
        .send()
        .await
        .map_err(|e| format!("Token exchange request failed: {}", e))?;

    if !response.status().is_success() {
        let error_text = response
            .text()
            .await
            .unwrap_or_else(|_| "Unknown error".to_string());
        return Err(format!("Token exchange failed: {}", error_text));
    }

    let tokens: OAuthTokens = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse tokens: {}", e))?;

    Ok(tokens)
}

/// Decode JWT id_token to get user info (basic implementation)
#[tauri::command]
pub fn decode_id_token(id_token: String) -> Result<GoogleUserInfo, String> {
    // Split JWT into parts
    let parts: Vec<&str> = id_token.split('.').collect();
    if parts.len() != 3 {
        return Err("Invalid JWT format".to_string());
    }

    // Decode payload (base64url)
    let payload = parts[1];

    // Add padding if needed for base64 decoding
    let padding_needed = (4 - (payload.len() % 4)) % 4;
    let padded_payload = format!("{}{}", payload, "=".repeat(padding_needed));

    let decoded = base64::decode(&padded_payload.replace('-', "+").replace('_', "/"))
        .map_err(|e| format!("Failed to decode JWT: {}", e))?;

    let user_info: GoogleUserInfo = serde_json::from_slice(&decoded)
        .map_err(|e| format!("Failed to parse user info: {}", e))?;

    Ok(user_info)
}

/// Refresh access token using refresh token
#[tauri::command]
pub async fn refresh_access_token(
    refresh_token: String,
    client_id: String,
    client_secret: String,
) -> Result<OAuthTokens, String> {
    let client = reqwest::Client::new();

    let mut params = HashMap::new();
    params.insert("refresh_token", refresh_token);
    params.insert("client_id", client_id);
    params.insert("client_secret", client_secret);
    params.insert("grant_type", "refresh_token".to_string());

    let response = client
        .post("https://oauth2.googleapis.com/token")
        .form(&params)
        .send()
        .await
        .map_err(|e| format!("Token refresh request failed: {}", e))?;

    if !response.status().is_success() {
        return Err("Token refresh failed - user may need to re-authenticate".to_string());
    }

    let tokens: OAuthTokens = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse refreshed tokens: {}", e))?;

    Ok(tokens)
}
