package com.konaos.healthbridge

import android.content.Context
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.records.DistanceRecord
import androidx.health.connect.client.records.ExerciseSessionRecord
import androidx.health.connect.client.records.HeartRateVariabilityRmssdRecord
import androidx.health.connect.client.records.RestingHeartRateRecord
import androidx.health.connect.client.records.SleepSessionRecord
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import org.json.JSONObject
import java.time.Duration
import java.time.Instant
import java.time.ZoneId
import java.time.temporal.ChronoUnit
import kotlin.math.abs

object HealthReader {
  fun permitted() = setOf(
    androidx.health.connect.client.permission.HealthPermission.getReadPermission(SleepSessionRecord::class),
    androidx.health.connect.client.permission.HealthPermission.getReadPermission(HeartRateVariabilityRmssdRecord::class),
    androidx.health.connect.client.permission.HealthPermission.getReadPermission(RestingHeartRateRecord::class),
    androidx.health.connect.client.permission.HealthPermission.getReadPermission(ExerciseSessionRecord::class),
    androidx.health.connect.client.permission.HealthPermission.getReadPermission(DistanceRecord::class)
  )
  private fun date(t: Instant): String = t.atZone(ZoneId.systemDefault()).toLocalDate().toString()
  private fun sport(type: Int): String? = when (type) {
    ExerciseSessionRecord.EXERCISE_TYPE_BIKING, ExerciseSessionRecord.EXERCISE_TYPE_BIKING_STATIONARY -> "bike"
    ExerciseSessionRecord.EXERCISE_TYPE_RUNNING, ExerciseSessionRecord.EXERCISE_TYPE_RUNNING_TREADMILL -> "run"
    ExerciseSessionRecord.EXERCISE_TYPE_SWIMMING_OPEN_WATER, ExerciseSessionRecord.EXERCISE_TYPE_SWIMMING_POOL -> "swim"
    ExerciseSessionRecord.EXERCISE_TYPE_STRENGTH_TRAINING -> "strength"
    ExerciseSessionRecord.EXERCISE_TYPE_YOGA, ExerciseSessionRecord.EXERCISE_TYPE_WALKING -> "mobility"
    else -> null
  }
  data class Results(val activities: List<JSONObject>, val wellness: List<JSONObject>)
  suspend fun read(ctx: Context): Results {
    val client = HealthConnectClient.getOrCreate(ctx)
    val granted = client.permissionController.getGrantedPermissions()
    require(granted.containsAll(permitted())) { "Faltan permisos para sueño, HRV, FC, entrenamientos o distancia." }
    val to = Instant.now()
    val from = to.minus(14, ChronoUnit.DAYS)
    val filter = TimeRangeFilter.between(from, to)
    val sessionResponse = client.readRecords(ReadRecordsRequest(ExerciseSessionRecord::class, filter))
    val distanceResponse = client.readRecords(ReadRecordsRequest(DistanceRecord::class, filter))
    val candidates = mutableListOf<JSONObject>()
    for (s in sessionResponse.records) {
      val kind = sport(s.exerciseType) ?: continue
      val mins = Duration.between(s.startTime, s.endTime).toMinutes().toInt()
      if (mins !in 1..1500) continue
      val origin = s.metadata.dataOrigin.packageName
      val isStrava = origin.contains("strava", ignoreCase = true)
      val dist = distanceResponse.records.filter { it.metadata.dataOrigin.packageName == origin &&
        !it.startTime.isBefore(s.startTime.minusSeconds(60)) && !it.endTime.isAfter(s.endTime.plusSeconds(60))
      }.sumOf { it.distance.inMeters }
      candidates.add(JSONObject()
        .put("id", "health-${s.metadata.id}")
        .put("source", if (isStrava) "Strava vía Salud Conectada" else "Google Health / Salud Conectada")
        .put("sourceDate", s.startTime.toString())
        .put("date", date(s.startTime))
        .put("type", kind)
        .put("title", s.title ?: if (isStrava) "Strava · $kind" else "Salud Conectada · $kind")
        .put("minutes", mins)
        .put("elapsedSec", Duration.between(s.startTime, s.endTime).seconds)
        .put("distanceM", if (dist > 0) dist else JSONObject.NULL)
        .put("originPackage", origin)
        .put("hr", JSONObject.NULL)
        .put("watts", JSONObject.NULL)
        .put("trainingLoad", JSONObject.NULL))
    }
    // Si Google Health y Strava vuelcan dos copias del mismo ejercicio,
    // conserva Strava y evita computar dos veces sesiones prácticamente idénticas.
    val selected = mutableListOf<JSONObject>()
    for (x in candidates.sortedByDescending { it.optString("source").contains("Strava") }) {
      val t = Instant.parse(x.getString("sourceDate"))
      val duplicate = selected.any { old ->
        old.getString("type") == x.getString("type") &&
          abs(Duration.between(Instant.parse(old.getString("sourceDate")), t).toMinutes()) <= 3 &&
          abs(old.getInt("minutes") - x.getInt("minutes")) <= 4
      }
      if (!duplicate) selected.add(x)
    }
    val sleeps = client.readRecords(ReadRecordsRequest(SleepSessionRecord::class, filter)).records
    val hrvs = client.readRecords(ReadRecordsRequest(HeartRateVariabilityRmssdRecord::class, filter)).records
    val rhrs = client.readRecords(ReadRecordsRequest(RestingHeartRateRecord::class, filter)).records
    val dates = (sleeps.map { date(it.endTime) } + hrvs.map { date(it.time) } + rhrs.map { date(it.time) }).distinct()
    val wellness = dates.map { day ->
      val sleepSec = sleeps.filter { date(it.endTime) == day }.sumOf { Duration.between(it.startTime, it.endTime).seconds }
      val hr = hrvs.filter { date(it.time) == day }.map { it.heartRateVariabilityMillis }
      val rest = rhrs.filter { date(it.time) == day }.map { it.beatsPerMinute.toDouble() }
      val obj = JSONObject().put("date", day).put("source", "Salud Conectada")
      obj.put("sleepHours", if (sleepSec>0) ((sleepSec/360.0).toInt()/10.0) else JSONObject.NULL)
      obj.put("hrv", if (hr.isNotEmpty()) (hr.average()*10).toInt()/10.0 else JSONObject.NULL)
      obj.put("rhr", if (rest.isNotEmpty()) rest.average().toInt() else JSONObject.NULL)
      obj
    }
    return Results(selected,wellness)
  }
}
