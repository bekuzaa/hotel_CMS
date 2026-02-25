package com.hotel.tvlauncher

import android.content.Context
import android.content.pm.PackageManager
import android.util.Log
import java.io.IOException

class AppCleaner(private val context: Context) {
    
    companion object {
        private const val TAG = "AppCleaner"
        
        // List of streaming apps to clear data from
        val STREAMING_APPS = listOf(
            // Video Streaming
            "com.google.android.youtube.tv",      // YouTube TV
            "com.netflix.ninja",                   // Netflix (Android TV)
            "com.amazon.avod.thirdpartyclient",    // Amazon Prime Video
            "com.disney.disneyplus",               // Disney+
            "com.hbo.hbonow",                      // HBO Now
            "com.hulu.livingroomplus",             // Hulu (Android TV)
            "com.apple.atve.androidtv.appletv",    // Apple TV+
            "com.paramount.paramountplus",         // Paramount+
            "com.peacocktv.peacockandroid",        // Peacock
            "com.showtime.standalone",             // Showtime
            
            // Music Streaming
            "com.spotify.tv.android",              // Spotify (Android TV)
            "com.google.android.apps.youtube.music", // YouTube Music
            
            // Other Apps
            "com.plexapp.android",                 // Plex
            "com.sling",                           // Sling TV
            "com.philo.philo",                     // Philo
            "com.fubo.tv",                         // FuboTV
            "com.tubi.tv",                         // Tubi
            "com.vudu.air.DownloaderTablet",       // Vudu
            
            // Social Media (if installed)
            "com.google.android.videos",           // Google Play Movies
            "com.microsoft.xboxone.smartglass"     // Xbox
        )
    }
    
    private val packageManager: PackageManager = context.packageManager
    
    /**
     * Clear data for all streaming apps
     * Returns list of successfully cleared apps
     */
    fun clearAllStreamingAppsData(): ClearResult {
        val successList = mutableListOf<String>()
        val failedList = mutableListOf<String>()
        
        for (packageName in STREAMING_APPS) {
            try {
                if (isAppInstalled(packageName)) {
                    if (clearAppData(packageName)) {
                        successList.add(packageName)
                        Log.d(TAG, "Successfully cleared data for: $packageName")
                    } else {
                        failedList.add(packageName)
                        Log.e(TAG, "Failed to clear data for: $packageName")
                    }
                } else {
                    Log.d(TAG, "App not installed: $packageName")
                }
            } catch (e: Exception) {
                failedList.add(packageName)
                Log.e(TAG, "Error clearing data for $packageName: ${e.message}")
            }
        }
        
        return ClearResult(successList, failedList)
    }
    
    /**
     * Clear data for a specific app
     */
    fun clearAppData(packageName: String): Boolean {
        return try {
            // Method 1: Using PM command (requires root or system signature)
            val process = Runtime.getRuntime().exec("pm clear $packageName")
            process.waitFor()
            
            // Check if successful by reading output
            val output = process.inputStream.bufferedReader().use { it.readText() }
            val errorOutput = process.errorStream.bufferedReader().use { it.readText() }
            
            if (output.contains("Success") || errorOutput.isEmpty()) {
                true
            } else {
                // Method 2: Try using deleteApplicationCache (requires system privileges)
                clearAppDataViaPackageManager(packageName)
            }
        } catch (e: IOException) {
            Log.e(TAG, "IO Exception while clearing $packageName: ${e.message}")
            false
        } catch (e: InterruptedException) {
            Log.e(TAG, "Interrupted while clearing $packageName: ${e.message}")
            Thread.currentThread().interrupt()
            false
        }
    }
    
    /**
     * Alternative method to clear app data using PackageManager
     * Requires system signature or elevated privileges
     */
    private fun clearAppDataViaPackageManager(packageName: String): Boolean {
        return try {
            // This requires system signature or root
            val pmClearMethod = packageManager.javaClass.getMethod(
                "clearApplicationUserData",
                String::class.java,
                IPackageStatsObserver::class.java
            )
            
            pmClearMethod.invoke(packageManager, packageName, object : IPackageStatsObserver {
                override fun onRemoveCompleted(pkgName: String?, succeeded: Boolean) {
                    Log.d(TAG, "Clear application user data completed for: $pkgName, success: $succeeded")
                }
            })
            
            true
        } catch (e: Exception) {
            Log.e(TAG, "Failed to clear via PackageManager: ${e.message}")
            false
        }
    }
    
    /**
     * Check if an app is installed
     */
    fun isAppInstalled(packageName: String): Boolean {
        return try {
            packageManager.getPackageInfo(packageName, 0)
            true
        } catch (e: PackageManager.NameNotFoundException) {
            false
        }
    }
    
    /**
     * Get list of installed streaming apps
     */
    fun getInstalledStreamingApps(): List<String> {
        return STREAMING_APPS.filter { isAppInstalled(it) }
    }
    
    /**
     * Force stop an app (requires root)
     */
    fun forceStopApp(packageName: String): Boolean {
        return try {
            val process = Runtime.getRuntime().exec("am force-stop $packageName")
            process.waitFor()
            true
        } catch (e: Exception) {
            Log.e(TAG, "Failed to force stop $packageName: ${e.message}")
            false
        }
    }
    
    /**
     * Clear cache only (doesn't require root, but limited effectiveness)
     */
    fun clearAppCache(packageName: String): Boolean {
        return try {
            val packageInfo = packageManager.getPackageInfo(packageName, 0)
            val applicationInfo = packageInfo.applicationInfo
            
            // Clear cache directory
            val cacheDir = applicationInfo.cacheDir
            deleteDirectory(cacheDir)
            
            Log.d(TAG, "Cleared cache for: $packageName")
            true
        } catch (e: Exception) {
            Log.e(TAG, "Failed to clear cache for $packageName: ${e.message}")
            false
        }
    }
    
    /**
     * Delete a directory recursively
     */
    private fun deleteDirectory(directory: java.io.File): Boolean {
        return if (directory.exists()) {
            val files = directory.listFiles()
            if (files != null) {
                for (file in files) {
                    if (file.isDirectory) {
                        deleteDirectory(file)
                    } else {
                        file.delete()
                    }
                }
            }
            directory.delete()
        } else {
            false
        }
    }
    
    /**
     * Get app info
     */
    fun getAppInfo(packageName: String): AppInfo? {
        return try {
            val packageInfo = packageManager.getPackageInfo(packageName, 0)
            val appName = packageManager.getApplicationLabel(packageInfo.applicationInfo).toString()
            
            AppInfo(
                packageName = packageName,
                appName = appName,
                versionName = packageInfo.versionName ?: "Unknown",
                versionCode = packageInfo.longVersionCode.toString(),
                installed = true
            )
        } catch (e: PackageManager.NameNotFoundException) {
            null
        }
    }
    
    /**
     * Get all streaming apps info
     */
    fun getAllStreamingAppsInfo(): List<AppInfo> {
        return STREAMING_APPS.mapNotNull { getAppInfo(it) }
    }
}

/**
 * Result data class
 */
data class ClearResult(
    val successApps: List<String>,
    val failedApps: List<String>
) {
    val totalApps = successApps.size + failedApps.size
    val successCount = successApps.size
    val failedCount = failedApps.size
    val isSuccess = failedApps.isEmpty()
}

/**
 * App info data class
 */
data class AppInfo(
    val packageName: String,
    val appName: String,
    val versionName: String,
    val versionCode: String,
    val installed: Boolean
)

/**
 * Interface for package stats observer
 */
interface IPackageStatsObserver {
    fun onRemoveCompleted(pkgName: String?, succeeded: Boolean)
}
