package com.hotel.tvlauncher

import android.content.Context
import android.media.AudioManager
import android.util.Log
import java.io.IOException

class DeviceController(private val context: Context) {
    
    companion object {
        private const val TAG = "DeviceController"
    }
    
    private val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
    
    /**
     * Get current volume level (0-100)
     */
    fun getVolumeLevel(): Int {
        return try {
            val currentVolume = audioManager.getStreamVolume(AudioManager.STREAM_MUSIC)
            val maxVolume = audioManager.getStreamMaxVolume(AudioManager.STREAM_MUSIC)
            (currentVolume.toDouble() / maxVolume.toDouble() * 100).toInt()
        } catch (e: Exception) {
            Log.e(TAG, "Error getting volume", e)
            50 // Default to 50%
        }
    }
    
    /**
     * Set volume level (0-100)
     */
    fun setVolumeLevel(level: Int) {
        try {
            val clampedLevel = level.coerceIn(0, 100)
            val maxVolume = audioManager.getStreamMaxVolume(AudioManager.STREAM_MUSIC)
            val systemVolume = (clampedLevel.toDouble() / 100.0 * maxVolume).toInt()
            
            audioManager.setStreamVolume(
                AudioManager.STREAM_MUSIC,
                systemVolume,
                0
            )
            
            Log.d(TAG, "Volume set to $clampedLevel%")
        } catch (e: Exception) {
            Log.e(TAG, "Error setting volume", e)
        }
    }
    
    /**
     * Increase volume by 10%
     */
    fun increaseVolume() {
        val currentLevel = getVolumeLevel()
        setVolumeLevel(currentLevel + 10)
    }
    
    /**
     * Decrease volume by 10%
     */
    fun decreaseVolume() {
        val currentLevel = getVolumeLevel()
        setVolumeLevel(currentLevel - 10)
    }
    
    /**
     * Mute/unmute audio
     */
    fun toggleMute(): Boolean {
        return try {
            val isMuted = audioManager.getStreamVolume(AudioManager.STREAM_MUSIC) == 0
            
            if (isMuted) {
                // Unmute - restore to 50%
                setVolumeLevel(50)
                false
            } else {
                // Mute
                setVolumeLevel(0)
                true
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error toggling mute", e)
            false
        }
    }
    
    /**
     * Check if device is muted
     */
    fun isMuted(): Boolean {
        return audioManager.getStreamVolume(AudioManager.STREAM_MUSIC) == 0
    }
    
    /**
     * Reboot the device (requires root or system privileges)
     * Note: This will only work on rooted devices or with system signature
     */
    fun rebootDevice(): Boolean {
        return try {
            // Method 1: Try using PowerManager (requires SYSTEM_ALERT_WINDOW permission)
            val powerManager = context.getSystemService(Context.POWER_SERVICE) as android.os.PowerManager
            val rebootMethod = powerManager.javaClass.getMethod("reboot", String::class.java)
            rebootMethod.invoke(powerManager, null)
            true
        } catch (e: Exception) {
            Log.e(TAG, "Reboot failed - requires root: ${e.message}")
            
            // Method 2: Try root command
            try {
                val process = Runtime.getRuntime().exec("su")
                process.outputStream.writeBytes("reboot\n")
                process.outputStream.flush()
                process.waitFor()
                true
            } catch (e2: Exception) {
                Log.e(TAG, "Root reboot also failed", e2)
                false
            }
        }
    }
    
    /**
     * Shutdown the device (requires root or system privileges)
     * Note: This will only work on rooted devices or with system signature
     */
    fun shutdownDevice(): Boolean {
        return try {
            // Method 1: Try using PowerManager
            val powerManager = context.getSystemService(Context.POWER_SERVICE) as android.os.PowerManager
            val shutdownMethod = powerManager.javaClass.getMethod("shutdown", Boolean::class.javaPrimitiveType, String::class.java)
            shutdownMethod.invoke(powerManager, false, null)
            true
        } catch (e: Exception) {
            Log.e(TAG, "Shutdown failed - requires root: ${e.message}")
            
            // Method 2: Try root command
            try {
                val process = Runtime.getRuntime().exec("su")
                process.outputStream.writeBytes("reboot -p\n")
                process.outputStream.flush()
                process.waitFor()
                true
            } catch (e2: Exception) {
                Log.e(TAG, "Root shutdown also failed", e2)
                false
            }
        }
    }
    
    /**
     * Get device serial number
     */
    fun getDeviceSerialNumber(): String {
        return try {
            android.os.Build.SERIAL
        } catch (e: Exception) {
            "UNKNOWN"
        }
    }
    
    /**
     * Get Android version
     */
    fun getAndroidVersion(): String {
        return android.os.Build.VERSION.RELEASE
    }
    
    /**
     * Get device model
     */
    fun getDeviceModel(): String {
        return "${android.os.Build.MANUFACTURER} ${android.os.Build.MODEL}"
    }
}
