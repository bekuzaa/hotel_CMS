package com.hotel.tvlauncher

import retrofit2.http.*

interface HotelApiService {
    
    // Pairing endpoints
    @POST("/api/trpc/pairing.requestCode")
    suspend fun requestCode(@Body request: PairingRequest): PairingResponse
    
    @GET("/api/trpc/pairing.checkStatus")
    suspend fun checkPairingStatus(@Query("deviceId") deviceId: String): PairingStatusResponse
    
    @GET("/api/trpc/hotels.getById")
    suspend fun getHotelById(@Query("id") hotelId: Int): HotelResponse
    
    @GET("/api/trpc/tvApps.getByHotel")
    suspend fun getTVAppsByHotel(@Query("hotelId") hotelId: Int): TVAppsResponse
    
    @GET("/api/trpc/publicApi.getWeather")
    suspend fun getWeather(@Query("hotelId") hotelId: Int): WeatherResponse
}

data class PairingRequest(
    val jsonrpc: String = "2.0",
    val method: String,
    val params: PairingParams
)

data class PairingParams(
    val deviceId: String,
    val deviceName: String = "Android TV"
)

data class PairingResponse(
    val result: ResultData?
)

data class ResultData(
    val data: PairingCodeData?
)

data class PairingCodeData(
    val code: String,
    val expiresAt: String
)

data class PairingStatusResponse(
    val result: PairingStatusResult?
)

data class PairingStatusResult(
    val data: PairingStatusData?
)

data class PairingStatusData(
    val isPaired: Boolean,
    val hotelId: Int?,
    val roomNumber: String?
)

data class HotelResponse(
    val result: HotelResult?
)

data class HotelResult(
    val data: HotelData?
)

data class HotelData(
    val id: Int,
    val hotelName: String,
    val logoUrl: String?,
    val primaryColor: String?,
    val secondaryColor: String?,
    val welcomeMessage: String?,
    val welcomeMessageEn: String?,
    val wifiSSID: String?,
    val wifiPassword: String?,
    val supportPhone: String?,
    val supportEmail: String?
)

data class TVAppsResponse(
    val result: TVAppsResult?
)

data class TVAppsResult(
    val data: List<TVAppData>?
)

data class TVAppData(
    val id: Int,
    val appName: String,
    val customLabel: String?,
    val appType: String,
    val iconName: String?,
    val iconUrl: String?,
    val deepLink: String?,
    val packageName: String?,
    val displayOrder: Int
)

data class WeatherResponse(
    val result: WeatherResult?
)

data class WeatherResult(
    val data: WeatherData?
)

data class WeatherData(
    val city: String,
    val temp: Double,
    val description: String,
    val icon: String
)
