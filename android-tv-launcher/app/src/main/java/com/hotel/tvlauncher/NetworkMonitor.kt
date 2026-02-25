package com.hotel.tvlauncher

import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.Build
import android.util.Log
import okhttp3.*
import org.json.JSONObject
import java.io.IOException
import java.util.concurrent.TimeUnit

class NetworkMonitor(private val context: Context) {
    
    companion object {
        private const val TAG = "NetworkMonitor"
        private const val HEARTBEAT_INTERVAL_MS = 30_000L // 30 seconds
    }
    
    private val client = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(10, TimeUnit.SECONDS)
        .build()
    
    private var heartbeatRunnable: Runnable? = null
    private val handler = android.os.Handler(android.os.Looper.getMainLooper())
    
    interface ConnectionListener {
        fun onConnectionStateChanged(isOnline: Boolean)
        fun onHeartbeatSent(success: Boolean)
    }
    
    /**
     * Check if device has internet connection
     */
    fun isOnline(): Boolean {
        val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val network = connectivityManager.activeNetwork
            val capabilities = connectivityManager.getNetworkCapabilities(network)
            return capabilities != null && 
                   (capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) ||
                    capabilities.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET))
        } else {
            @Suppress("DEPRECATION")
            val networkInfo = connectivityManager.activeNetworkInfo
            return networkInfo != null && networkInfo.isConnected
        }
    }
    
    /**
     * Get connection type (WiFi/Ethernet)
     */
    fun getConnectionType(): String {
        val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val network = connectivityManager.activeNetwork
            val capabilities = connectivityManager.getNetworkCapabilities(network)
            
            return when {
                capabilities?.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) == true -> "WiFi"
                capabilities?.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET) == true -> "Ethernet"
                else -> "Unknown"
            }
        }
        
        return "Unknown"
    }
    
    /**
     * Send heartbeat to CMS server
     */
    fun sendHeartbeat(listener: ConnectionListener) {
        if (!isOnline()) {
            listener.onConnectionStateChanged(false)
            return
        }
        
        val deviceId = PreferencesManager.getDeviceId(context)
        val cmsUrl = PreferencesManager.getCMSUrl(context)
        
        val json = JSONObject().apply {
            put("jsonrpc", "2.0")
            put("method", "deviceStatus.updateStatus")
            put("params", JSONObject().apply {
                put("deviceId", deviceId)
                put("status", "online")
                put("volume", DeviceController(context).getVolumeLevel())
                put("isMuted", DeviceController(context).isMuted())
                put("connectionType", getConnectionType())
                put("androidVersion", DeviceController(context).getAndroidVersion())
                put("deviceModel", DeviceController(context).getDeviceModel())
            })
        }
        
        val request = Request.Builder()
            .url("$cmsUrl/api/trpc/deviceStatus.updateStatus")
            .post(RequestBody.create(
                okhttp3.MediaType.parse("application/json"),
                json.toString()
            ))
            .build()
        
        Log.d(TAG, "Sending heartbeat for device: $deviceId")
        
        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                Log.e(TAG, "Heartbeat failed", e)
                listener.onConnectionStateChanged(false)
                listener.onHeartbeatSent(false)
            }
            
            override fun onResponse(call: Call, response: Response) {
                try {
                    val responseBody = response.body?.string()
                    
                    if (response.isSuccessful) {
                        Log.d(TAG, "Heartbeat successful")
                        listener.onConnectionStateChanged(true)
                        listener.onHeartbeatSent(true)
                    } else {
                        Log.e(TAG, "Heartbeat failed with code: ${response.code}")
                        listener.onConnectionStateChanged(false)
                        listener.onHeartbeatSent(false)
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Error parsing heartbeat response", e)
                    listener.onConnectionStateChanged(false)
                    listener.onHeartbeatSent(false)
                }
            }
        })
    }
    
    /**
     * Start periodic heartbeat to CMS
     */
    fun startHeartbeat(listener: ConnectionListener) {
        stopHeartbeat() // Stop any existing heartbeat
        
        heartbeatRunnable = object : Runnable {
            override fun run() {
                sendHeartbeat(listener)
                handler.postDelayed(this, HEARTBEAT_INTERVAL_MS)
            }
        }
        
        handler.post(heartbeatRunnable!!)
        Log.d(TAG, "Heartbeat started with interval: ${HEARTBEAT_INTERVAL_MS / 1000}s")
    }
    
    /**
     * Stop periodic heartbeat
     */
    fun stopHeartbeat() {
        heartbeatRunnable?.let {
            handler.removeCallbacks(it)
            heartbeatRunnable = null
            Log.d(TAG, "Heartbeat stopped")
        }
    }
    
    /**
     * Get signal strength (for WiFi)
     */
    fun getSignalStrength(): Int {
        // Returns 0-4 (similar to WiFi bars)
        return try {
            val wifiManager = context.getSystemService(Context.WIFI_SERVICE) as android.net.wifi.WifiManager
            val wifiInfo = wifiManager.connectionInfo
            android.net.wifi.WifiManager.calculateSignalLevel(wifiInfo.rssi, 5)
        } catch (e: Exception) {
            -1
        }
    }
}
