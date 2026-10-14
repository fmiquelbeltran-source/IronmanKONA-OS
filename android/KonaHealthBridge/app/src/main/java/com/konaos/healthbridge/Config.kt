package com.konaos.healthbridge

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

object Config {
  private fun prefs(ctx: Context) = EncryptedSharedPreferences.create(
    ctx, "kona_bridge_private", MasterKey.Builder(ctx).setKeyScheme(MasterKey.KeyScheme.AES256_GCM).build(),
    EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
    EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
  )
  fun read(ctx: Context, key: String): String = prefs(ctx).getString(key, "") ?: ""
  fun write(ctx: Context, key: String, value: String) = prefs(ctx).edit().putString(key, value).apply()
  fun clear(ctx: Context) = prefs(ctx).edit().clear().apply()
}
