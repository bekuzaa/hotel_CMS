package com.hotel.tvlauncher

import android.util.Log
import kotlinx.coroutines.*
import okhttp3.*
import org.json.JSONObject
import java.io.IOException
import java.util.concurrent.TimeUnit

class PairingManager(private val context: android.content.Context) {
    
    companion object {
        private const val TAG = "PairingManager"
    }
    
    private val client = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .build()
    
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    
    interface PairingListener {
        fun onPairingCodeReceived(code: String)
        fun onPairingSuccess(hotelId: Int, roomNumber: String)
        fun onPairingError(message: String)
    }
    
    fun requestCode(listener: PairingListener) {
        val deviceId = PreferencesManager.getDeviceId(context)
        val cmsUrl = PreferencesManager.getCMSUrl(context)
        
        val json = JSONObject().apply {
            put("jsonrpc", "2.0")
            put("method", "pairing.requestCode")
            put("params", JSONObject().apply {
                put("deviceId", deviceId)
                put("deviceName", "Android TV - $deviceId")
            })
        }
        
        val request = Request.Builder()
            .url("$cmsUrl/api/trpc/pairing.requestCode")
            .post(RequestBody.create(
                okhttp3.MediaType.parse("application/json"),
                json.toString()
            ))
            .build()
        
        Log.d(TAG, "Requesting pairing code for device: $deviceId")
        
        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                Log.e(TAG, "Failed to request pairing code", e)
                withContext(Dispatchers.Main) {
                    listener.onPairingError("Network error: ${e.message}")
                }
            }
            
            override fun onResponse(call: Call, response: Response) {
                try {
                    val responseBody = response.body?.string()
                    Log.d(TAG, "Response: $responseBody")
                    
                    if (response.isSuccessful && responseBody != null) {
                        val jsonResponse = JSONObject(responseBody)
                        val result = jsonResponse.getJSONObject("result")
                        val data = result.getJSONObject("data")
                        val code = data.getString("code")
                        
                        PreferencesManager.setPairingCode(context, code)
                        
                        withContext(Dispatchers.Main) {
                            listener.onPairingCodeReceived(code)
                        }
                        
                        // Start polling for status
                        startPolling(listener)
                    } else {
                        withContext(Dispatchers.Main) {
                            listener.onPairingError("Failed to get pairing code")
                        }
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Error parsing response", e)
                    withContext(Dispatchers.Main) {
                        listener.onPairingError("Error: ${e.message}")
                    }
                }
            }
        })
    }
    
    private fun startPolling(listener: PairingListener) {
        scope.launch {
            var attempts = 0
            val maxAttempts = 60 // 5 minutes (poll every 5 seconds)
            
            while (attempts < maxAttempts) {
                delay(5000)
                
                if (checkPairingStatus(listener)) {
                    break
                }
                
                attempts++
            }
            
            if (attempts >= maxAttempts) {
                withContext(Dispatchers.Main) {
                    listener.onPairingError("Pairing timeout")
                }
            }
        }
    }
    
    private suspend fun checkPairingStatus(listener: PairingListener): Boolean {
        return suspendCoroutine { continuation ->
            val deviceId = PreferencesManager.getDeviceId(context)
            val cmsUrl = PreferencesManager.getCMSUrl(context)
            
            val url = "$cmsUrl/api/trpc/pairing.checkStatus?input=${JSONObject().apply {
                put("deviceId", deviceId)
            }}"
            
            val request = Request.Builder()
                .url(url)
                .get()
                .build()
            
            client.newCall(request).enqueue(object : Callback {
                override fun onFailure(call: Call, e: IOException) {
                    Log.e(TAG, "Failed to check pairing status", e)
                    continuation.resume(false)
                }
                
                override fun onResponse(call: Call, response: Response) {
                    try {
                        val responseBody = response.body?.string()
                        
                        if (response.isSuccessful && responseBody != null) {
                            val jsonResponse = JSONObject(responseBody)
                            val result = jsonResponse.getJSONObject("result")
                            val data = result.getJSONObject("data")
                            
                            val isPaired = data.getBoolean("isPaired")
                            
                            if (isPaired) {
                                val hotelId = data.getInt("hotelId")
                                val roomNumber = data.getString("roomNumber")
                                
                                PreferencesManager.setPaired(context, true)
                                PreferencesManager.setHotelId(context, hotelId)
                                PreferencesManager.setRoomNumber(context, roomNumber)
                                
                                Log.d(TAG, "Successfully paired! Hotel: $hotelId, Room: $roomNumber")
                                
                                withContext(Dispatchers.Main) {
                                    listener.onPairingSuccess(hotelId, roomNumber)
                                }
                                
                                continuation.resume(true)
                            } else {
                                continuation.resume(false)
                            }
                        } else {
                            continuation.resume(false)
                        }
                    } catch (e: Exception) {
                        Log.e(TAG, "Error checking pairing status", e)
                        continuation.resume(false)
                    }
                }
            })
        }
    }
    
    fun cancelPolling() {
        scope.cancel()
    }
}
