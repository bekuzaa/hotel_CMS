package com.hotel.tvlauncher

import android.content.Context
import android.content.SharedPreferences

object PreferencesManager {
    private const val PREFS_NAME = "hotel_settings"
    private const val KEY_CMS_URL = "cms_url"
    private const val KEY_SETTINGS_PASSWORD = "settings_password"
    private const val KEY_IS_PAIRED = "is_paired"
    private const val KEY_HOTEL_ID = "hotel_id"
    private const val KEY_ROOM_NUMBER = "room_number"
    private const val KEY_DEVICE_ID = "device_id"
    private const val KEY_PAIRING_CODE = "pairing_code"
    
    fun getPreferences(context: Context): SharedPreferences {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }
    
    fun getCMSUrl(context: Context): String {
        return getPreferences(context).getString(KEY_CMS_URL, "http://192.168.1.100:3000") 
            ?: "http://192.168.1.100:3000"
    }
    
    fun setCMSUrl(context: Context, url: String) {
        getPreferences(context).edit().putString(KEY_CMS_URL, url).apply()
    }
    
    fun getSettingsPassword(context: Context): String {
        return getPreferences(context).getString(KEY_SETTINGS_PASSWORD, "9988") 
            ?: "9988"
    }
    
    fun setSettingsPassword(context: Context, password: String) {
        getPreferences(context).edit().putString(KEY_SETTINGS_PASSWORD, password).apply()
    }
    
    fun isPaired(context: Context): Boolean {
        return getPreferences(context).getBoolean(KEY_IS_PAIRED, false)
    }
    
    fun setPaired(context: Context, isPaired: Boolean) {
        getPreferences(context).edit().putBoolean(KEY_IS_PAIRED, isPaired).apply()
    }
    
    fun getHotelId(context: Context): Int? {
        return if (getPreferences(context).contains(KEY_HOTEL_ID)) {
            getPreferences(context).getInt(KEY_HOTEL_ID, -1).takeIf { it != -1 }
        } else null
    }
    
    fun setHotelId(context: Context, hotelId: Int) {
        getPreferences(context).edit().putInt(KEY_HOTEL_ID, hotelId).apply()
    }
    
    fun getRoomNumber(context: Context): String? {
        return getPreferences(context).getString(KEY_ROOM_NUMBER, null)
    }
    
    fun setRoomNumber(context: Context, roomNumber: String) {
        getPreferences(context).edit().putString(KEY_ROOM_NUMBER, roomNumber).apply()
    }
    
    fun getDeviceId(context: Context): String {
        val prefs = getPreferences(context)
        return prefs.getString(KEY_DEVICE_ID, null) ?: run {
            val newId = "TV-${System.currentTimeMillis().toString(36)}".uppercase()
            prefs.edit().putString(KEY_DEVICE_ID, newId).apply()
            newId
        }
    }
    
    fun getPairingCode(context: Context): String? {
        return getPreferences(context).getString(KEY_PAIRING_CODE, null)
    }
    
    fun setPairingCode(context: Context, code: String) {
        getPreferences(context).edit().putString(KEY_PAIRING_CODE, code).apply()
    }
    
    fun clearPairingData(context: Context) {
        getPreferences(context).edit()
            .remove(KEY_IS_PAIRED)
            .remove(KEY_HOTEL_ID)
            .remove(KEY_ROOM_NUMBER)
            .remove(KEY_PAIRING_CODE)
            .apply()
    }
}
