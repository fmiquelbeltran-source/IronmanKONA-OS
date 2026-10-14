package com.konaos.healthbridge

import android.app.Activity
import android.os.Bundle
import android.view.ViewGroup
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import androidx.activity.ComponentActivity
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.HealthConnectFeatures
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.permission.HealthPermission
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.launch
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class MainActivity : ComponentActivity() {
  private lateinit var status: TextView
  private lateinit var endpoint: EditText
  private lateinit var key: EditText
  private lateinit var email: EditText
  private lateinit var password: EditText
  private val permissionRequest = registerForActivityResult(PermissionController.createRequestPermissionResultContract()) { granted ->
    status.text = if (granted.containsAll(HealthReader.permitted())) "Datos autorizados. Ya puedes sincronizar." else "Faltan permisos. Solo accederemos a las categorías que autorices."
  }
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    val parent = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; setPadding(28,30,28,30) }
    val scroll = ScrollView(this).apply { addView(parent) }
    setContentView(scroll)
    fun txt(message: String) = TextView(this).also { it.text=message; it.textSize=15f; it.setPadding(0,12,0,12);parent.addView(it) }
    fun field(hint: String, value: String="",secret:Boolean=false) = EditText(this).also {
      it.hint=hint;it.setSingleLine(true);it.setText(value)
      if(secret) it.inputType=android.text.InputType.TYPE_CLASS_TEXT or android.text.InputType.TYPE_TEXT_VARIATION_PASSWORD
      parent.addView(it, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT,ViewGroup.LayoutParams.WRAP_CONTENT))
    }
    fun action(label: String, block:()->Unit) = Button(this).also { it.text=label;parent.addView(it);it.setOnClickListener{block()} }
    txt("KONA OS 2030 · Google Health + Strava")
    txt("Este conector SOLO LEE de Salud Conectada: sueño, HRV, FC en reposo, ejercicios y distancia. Los envía a TU Supabase privada. No requiere Domestique ni permisos de escritura en Salud Conectada.")
    endpoint=field("URL Supabase https://...supabase.co",Config.read(this,"url"))
    key=field("Clave publicable Supabase (nunca service_role)",Config.read(this,"pub"))
    email=field("Correo de usuario Supabase")
    password=field("Contraseña de Supabase (solo para acceder)",secret=true)
    status=txt("Estado: sin configurar. Último resultado: ${Config.read(this,"lastResult")}")
    action("1 · Guardar URL y clave pública") {
      val url=endpoint.text.toString().trim().trimEnd('/')
      if(!Regex("https://[a-z0-9-]+\\.supabase\\.co").matches(url)){status.text="URL incorrecta";return@action}
      val pub=key.text.toString().trim()
      if(pub.isBlank() || pub.contains("service_role",ignoreCase=true)){status.text="Usa una clave publicable, no la service_role";return@action}
      Config.write(this,"url",url);Config.write(this,"pub",pub);status.text="Configuración pública guardada"
    }
    action("2 · Entrar en mi nube privada") {
      val e=email.text.toString().trim();val p=password.text.toString()
      lifecycleScope.launch {
        try{ withContext(Dispatchers.IO){Cloud.login(this@MainActivity,e,p)};password.text.clear();status.text="Autenticación correcta. La sesión se guarda cifrada en este dispositivo." }
        catch(err:Exception){status.text="No ha sido posible iniciar sesión: ${err.message}"}
      }
    }
    action("3 · Autorizar datos en Salud Conectada") {
      try {
        if(HealthConnectClient.getSdkStatus(this)==HealthConnectClient.SDK_UNAVAILABLE){status.text="Salud Conectada no está disponible en este dispositivo";return@action}
        val hc=HealthConnectClient.getOrCreate(this)
        val permissions=HealthReader.permitted().toMutableSet()
        if(hc.features.getFeatureStatus(HealthConnectFeatures.FEATURE_READ_HEALTH_DATA_IN_BACKGROUND)==HealthConnectFeatures.FEATURE_STATUS_AVAILABLE)
          permissions.add(HealthPermission.PERMISSION_READ_HEALTH_DATA_IN_BACKGROUND)
        permissionRequest.launch(permissions)
      } catch(e:Exception){status.text=e.message}
    }
    action("4 · Sincronizar ahora") {
      SyncWorker.once(this);status.text="Sincronización solicitada. Revisa el resultado dentro de unos segundos y actualiza tu web Kona OS."
    }
    action("5 · Activar sincronización periódica") {
      lifecycleScope.launch {
        try{status.text=if(SyncWorker.periodic(this@MainActivity)) "Sincronización periódica solicitada (aprox. 30 minutos; Android puede retrasarla)." else "Concede también el permiso de lectura en segundo plano o revisa compatibilidad de Android."}
        catch(err:Exception){status.text="Error: ${err.message}"}
      }
    }
    action("Consultar último resultado") { status.text=Config.read(this,"lastResult")+" · "+Config.read(this,"lastRun") }
    action("Desvincular y borrar acceso de este teléfono") { Config.clear(this);status.text="Sesión y configuración local borradas. Puedes retirar los permisos también en Salud Conectada." }
    txt("Privacidad: controla y retira permisos desde Ajustes → Salud Conectada. Para borrar registros enviados, utiliza el panel de Supabase. La web debe estar conectada a la misma cuenta.")
  }
}

class PermissionsRationaleActivity: Activity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    android.app.AlertDialog.Builder(this)
      .setTitle("Por qué Kona OS solicita acceso")
      .setMessage("Leemos sueño, HRV, FC en reposo, sesiones y distancia solo para tu seguimiento de entrenamiento y recuperación. Los datos van a TU nube Supabase privada. Puedes revocar permisos cuando quieras en Salud Conectada.")
      .setPositiveButton("Entendido") { _, _ -> finish() }
      .setOnCancelListener{finish()}.show()
  }
}
