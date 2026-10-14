package com.konaos.healthbridge

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

object Cloud {
  private fun request(ctx: Context, path: String, method: String, payload: Any? = null, auth: String? = null): String {
    val base = Config.read(ctx, "url").trimEnd('/')
    require(Regex("https://[a-z0-9-]+\\.supabase\\.co").matches(base)) { "URL Supabase no válida" }
    val pub = Config.read(ctx, "pub")
    require(pub.isNotBlank()) { "Falta clave publicable" }
    val connection = URL(base + path).openConnection() as HttpURLConnection
    connection.requestMethod = method
    connection.connectTimeout = 15000
    connection.readTimeout = 20000
    connection.setRequestProperty("apikey", pub)
    connection.setRequestProperty("Content-Type", "application/json")
    connection.setRequestProperty("Accept", "application/json")
    if (path.contains("on_conflict=")) connection.setRequestProperty("Prefer", "resolution=merge-duplicates,return=minimal")
    connection.setRequestProperty("Authorization", "Bearer " + (auth ?: pub))
    try {
      if (payload != null) {
        connection.doOutput = true
        connection.outputStream.use { it.write(payload.toString().toByteArray(Charsets.UTF_8)) }
      }
      val code = connection.responseCode
      if (code !in 200..299) throw IllegalStateException("Supabase HTTP $code. Revisa la cuenta y la tabla privada.")
      return connection.inputStream.bufferedReader().use { it.readText() }
    } finally { connection.disconnect() }
  }
  fun login(ctx: Context, email: String, password: String) {
    val body = JSONObject().put("email", email).put("password", password)
    val r = JSONObject(request(ctx, "/auth/v1/token?grant_type=password", "POST", body))
    require(r.optString("refresh_token").isNotBlank()) { "No se recibieron permisos" }
    Config.write(ctx, "refresh", r.getString("refresh_token"))
    Config.write(ctx, "user", r.getJSONObject("user").getString("id"))
  }
  private fun access(ctx: Context): String {
    val refresh = Config.read(ctx, "refresh")
    require(refresh.isNotBlank()) { "Entra primero con tu usuario de Supabase" }
    val body = JSONObject().put("refresh_token", refresh)
    val r = JSONObject(request(ctx, "/auth/v1/token?grant_type=refresh_token", "POST", body))
    val updated = r.optString("refresh_token", refresh)
    if (updated.isNotBlank()) Config.write(ctx, "refresh", updated)
    return r.getString("access_token")
  }
  fun upload(ctx: Context, activities: List<JSONObject>, recovery: List<JSONObject>): Pair<Int,Int> {
    val token = access(ctx)
    val uid = Config.read(ctx, "user")
    require(uid.isNotBlank()) { "Usuario sin identificar" }
    val activityRows = JSONArray()
    for (item in activities) activityRows.put(JSONObject().put("user_id", uid).put("source_id", item.getString("id"))
      .put("recorded_at", item.getString("date")).put("payload", item))
    val recoveryRows = JSONArray()
    for (item in recovery) recoveryRows.put(JSONObject().put("user_id", uid).put("day", item.getString("date"))
      .put("payload", item))
    if (activityRows.length() > 0) {
      request(ctx, "/rest/v1/kona_activities?on_conflict=user_id,source_id", "POST", activityRows, token)
    }
    if (recoveryRows.length() > 0) {
      request(ctx, "/rest/v1/kona_wellness?on_conflict=user_id,day", "POST", recoveryRows, token)
    }
    return activityRows.length() to recoveryRows.length()
  }
}
