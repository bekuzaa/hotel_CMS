package com.hotel.tvlauncher

import android.content.Context
import android.util.Log
import okhttp3.*
import org.json.JSONObject
import java.io.IOException
import java.util.concurrent.TimeUnit

class CheckoutListener(private val context: Context) {
    
    companion object {
        private const val TAG = "CheckoutListener"
        private const val CHECKOUT_EVENT_INTERVAL_MS = 5_000L // Check every 5 seconds
    }
    
    private val client = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(10, TimeUnit.SECONDS)
        .build()
    
    private var pollingRunnable: Runnable? = null
    private val handler = android.os.Handler(android.os.Looper.getMainLooper())
    private var appCleaner: AppCleaner? = null
    
    interface CheckoutCallback {
        fun onGuestCheckout(roomNumber: String, guestName: String?)
        fun onClearDataStarted()
        fun onClearDataCompleted(result: ClearResult)
        fun onError(message: String)
    }
    
    fun initAppCleaner() {
        appCleaner = AppCleaner(context)
    }
    
    /**
     * Start listening for checkout events from CMS
     */
    fun startListeningForCheckouts(callback: CheckoutCallback) {
        pollingRunnable = object : Runnable {
            override fun run() {
                checkForNewCheckouts(callback)
                handler.postDelayed(this, CHECKOUT_EVENT_INTERVAL_MS)
            }
        }
        
        handler.post(pollingRunnable!!)
        Log.d(TAG, "Started listening for checkouts")
    }
    
    /**
     * Stop listening for checkouts
     */
    fun stopListening() {
        pollingRunnable?.let {
            handler.removeCallbacks(it)
            pollingRunnable = null
            Log.d(TAG, "Stopped listening for checkouts")
        }
    }
    
    /**
     * Poll CMS for new checkout events
     */
    private fun checkForNewCheckouts(callback: CheckoutCallback) {
        if (!NetworkMonitor(context).isOnline()) {
            return
        }
        
        val deviceId = PreferencesManager.getDeviceId(context)
        val roomNumber = PreferencesManager.getRoomNumber(context) ?: return
        val cmsUrl = PreferencesManager.getCMSUrl(context)
        
        val json = JSONObject().apply {
            put("jsonrpc", "2.0")
            put("method", "guestInfo.checkRecentCheckouts")
            put("params", JSONObject().apply {
                put("deviceId", deviceId)
                put("roomNumber", roomNumber)
                put("lastCheckoutId", getLastProcessedCheckoutId())
            })
        }
        
        val request = Request.Builder()
            .url("$cmsUrl/api/trpc/guestInfo.checkRecentCheckouts")
            .post(RequestBody.create(
                okhttp3.MediaType.parse("application/json"),
                json.toString()
            ))
            .build()
        
        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                Log.e(TAG, "Failed to check for checkouts", e)
            }
            
            override fun onResponse(call: Call, response: Response) {
                try {
                    val responseBody = response.body?.string()
                    
                    if (response.isSuccessful && responseBody != null) {
                        val jsonResponse = JSONObject(responseBody)
                        val result = jsonResponse.getJSONObject("result")
                        val data = result.getJSONObject("data")
                        
                        val hasNewCheckout = data.getBoolean("hasNewCheckout")
                        
                        if (hasNewCheckout) {
                            val checkoutId = data.getInt("checkoutId")
                            val roomNum = data.getString("roomNumber")
                            val guestName = data.optString("guestName", null)
                            
                            // Process the checkout
                            processGuestCheckout(checkoutId, roomNum, guestName, callback)
                        }
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Error processing checkout response", e)
                    callback.onError("Error checking for checkouts: ${e.message}")
                }
            }
        })
    }
    
    /**
     * Process a guest checkout - clear all streaming app data
     */
    private fun processGuestCheckout(
        checkoutId: Int, 
        roomNumber: String, 
        guestName: String?,
        callback: CheckoutCallback
    ) {
        Log.d(TAG, "Processing checkout for Room $roomNumber (Guest: ${guestName ?: "Unknown"})")
        
        // Notify callback
        handler.post {
            callback.onGuestCheckout(roomNumber, guestName)
            callback.onClearDataStarted()
        }
        
        // Clear app data in background
        Thread {
            try {
                // Initialize app cleaner if not already done
                if (appCleaner == null) {
                    initAppCleaner()
                }
                
                // Clear all streaming apps data
                val result = appCleaner?.clearAllStreamingAppsData() 
                    ?: ClearResult(emptyList(), emptyList())
                
                // Update last processed checkout ID
                setLastProcessedCheckoutId(checkoutId)
                
                // Notify completion
                handler.post {
                    callback.onClearDataCompleted(result)
                }
                
                Log.d(TAG, "Checkout processing completed. Success: ${result.successCount}, Failed: ${result.failedCount}")
                
            } catch (e: Exception) {
                Log.e(TAG, "Error during checkout processing", e)
                handler.post {
                    callback.onError("Failed to clear app data: ${e.message}")
                }
            }
        }.start()
    }
    
    /**
     * Manually trigger app data clearing (for testing or manual execution)
     */
    fun triggerManualClearData(callback: CheckoutCallback) {
        handler.post {
            callback.onClearDataStarted()
        }
        
        Thread {
            try {
                if (appCleaner == null) {
                    initAppCleaner()
                }
                
                val result = appCleaner?.clearAllStreamingAppsData() 
                    ?: ClearResult(emptyList(), emptyList())
                
                handler.post {
                    callback.onClearDataCompleted(result)
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error in manual clear data", e)
                handler.post {
                    callback.onError("Failed to clear app data: ${e.message}")
                }
            }
        }.start()
    }
    
    /**
     * Get last processed checkout ID from preferences
     */
    private fun getLastProcessedCheckoutId(): Int {
        val prefs = context.getSharedPreferences("checkout_prefs", Context.MODE_PRIVATE)
        return prefs.getInt("last_checkout_id", 0)
    }
    
    /**
     * Save last processed checkout ID
     */
    private fun setLastProcessedCheckoutId(checkoutId: Int) {
        val prefs = context.getSharedPreferences("checkout_prefs", Context.MODE_PRIVATE)
        prefs.edit().putInt("last_checkout_id", checkoutId).apply()
        Log.d(TAG, "Saved last checkout ID: $checkoutId")
    }
    
    /**
     * Get list of installed streaming apps (for display/debugging)
     */
    fun getInstalledStreamingAppsList(): List<String> {
        return appCleaner?.getInstalledStreamingApps() ?: emptyList()
    }
}
