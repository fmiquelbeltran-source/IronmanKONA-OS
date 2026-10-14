package com.konaos.healthbridge

import android.content.Context
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.HealthConnectFeatures
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import java.util.concurrent.TimeUnit

class SyncWorker(context: Context, params: WorkerParameters): CoroutineWorker(context,params) {
  override suspend fun doWork(): Result = try {
    val data = HealthReader.read(applicationContext)
    val counts = Cloud.upload(applicationContext, data.activities, data.wellness)
    Config.write(applicationContext,"lastResult","Sincronización realizada: ${counts.first} actividades · ${counts.second} días de recuperación")
    Config.write(applicationContext,"lastRun",java.time.Instant.now().toString())
    Result.success()
  } catch (e: Exception) {
    Config.write(applicationContext,"lastResult","Pendiente: ${e.message?.take(150)}")
    Result.retry()
  }
  companion object {
    fun once(ctx: Context) {
      WorkManager.getInstance(ctx).enqueue(OneTimeWorkRequestBuilder<SyncWorker>()
        .setConstraints(Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build()).build())
    }
    suspend fun periodic(ctx: Context): Boolean {
      val hc = HealthConnectClient.getOrCreate(ctx)
      val available = hc.features.getFeatureStatus(HealthConnectFeatures.FEATURE_READ_HEALTH_DATA_IN_BACKGROUND) ==
        HealthConnectFeatures.FEATURE_STATUS_AVAILABLE
      if (!available) return false
      val granted = hc.permissionController.getGrantedPermissions()
      if (!granted.containsAll(HealthReader.permitted()) ||
          !granted.contains(androidx.health.connect.client.permission.HealthPermission.PERMISSION_READ_HEALTH_DATA_IN_BACKGROUND)) return false
      val request = PeriodicWorkRequestBuilder<SyncWorker>(30,TimeUnit.MINUTES)
        .setConstraints(Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build())
        .build()
      WorkManager.getInstance(ctx).enqueueUniquePeriodicWork("kona_health_sync", ExistingPeriodicWorkPolicy.KEEP, request)
      return true
    }
  }
}
