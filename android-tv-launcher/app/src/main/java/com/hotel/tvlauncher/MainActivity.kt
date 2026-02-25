package com.hotel.tvlauncher

import android.os.Bundle
import android.util.Log
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import android.view.KeyEvent
import android.view.View
import android.widget.*
import com.bumptech.glide.Glide
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import java.util.concurrent.TimeUnit

class MainActivity : AppCompatActivity() {

    private lateinit var recyclerView: RecyclerView
    private lateinit var timeText: TextView
    private lateinit var dateText: TextView
    private lateinit var weatherText: TextView
    private lateinit var deviceCodeText: TextView
    private lateinit var logoImage: ImageView
    private lateinit var welcomeText: TextView
    private lateinit var pairingStatusText: TextView
    
    private var selectedPosition = 0
    private var pairingCode = ""
    private var pairingManager: PairingManager? = null
    private var appsList = listOf<AppItem>()
    
    // API Service
    private lateinit var apiService: HotelApiService
    
    companion object {
        private const val TAG = "HotelTVLauncher"
        private const val DEFAULT_CMS_URL = "http://192.168.1.100:3000"
        private const val SETTINGS_PASSWORD_DEFAULT = "9988"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        // Initialize views
        initViews()
        
        // Setup API
        setupAPI()
        
        // Load initial data
        loadLauncherData()
        
        // Start clock
        startClock()
        
        // Request pairing code
        requestPairingCode()
    }

    private fun initViews() {
        recyclerView = findViewById(R.id.appsRecyclerView)
        timeText = findViewById(R.id.timeText)
        dateText = findViewById(R.id.dateText)
        weatherText = findViewById(R.id.weatherText)
        deviceCodeText = findViewById(R.id.deviceCodeText)
        logoImage = findViewById(R.id.hotelLogo)
        welcomeText = findViewById(R.id.welcomeText)
        
        // Setup RecyclerView
        recyclerView.layoutManager = LinearLayoutManager(this, LinearLayoutManager.HORIZONTAL, false)
        recyclerView.adapter = AppAdapter(emptyList()) { app ->
            Toast.makeText(this, "Opening ${app.name}", Toast.LENGTH_SHORT).show()
            launchApp(app)
        }
        
        // Handle remote control navigation
        recyclerView.setOnKeyListener { v, keyCode, event ->
            handleKeyEvent(keyCode, event)
        }
        
        // Initialize pairing manager
        pairingManager = PairingManager(this)
    }

    private fun setupAPI() {
        val cmsUrl = getSharedPreferences("hotel_settings", MODE_PRIVATE)
            .getString("cms_url", DEFAULT_CMS_URL) ?: DEFAULT_CMS_URL
        
        val client = OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .addInterceptor(HttpLoggingInterceptor().apply {
                level = HttpLoggingInterceptor.Level.BODY
            })
            .build()
        
        val retrofit = Retrofit.Builder()
            .baseUrl(cmsUrl)
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
        
        apiService = retrofit.create(HotelApiService::class.java)
    }

    private fun loadLauncherData() {
        // Get device ID
        val deviceId = PreferencesManager.getDeviceId(this)
        deviceCodeText.text = "Device: $deviceId"
        
        // Check if already paired
        if (PreferencesManager.isPaired(this)) {
            val hotelId = PreferencesManager.getHotelId(this)
            val roomNumber = PreferencesManager.getRoomNumber(this)
            pairingStatusText.text = "✓ Paired - Room $roomNumber"
            
            // Load hotel data
            if (hotelId != null) {
                loadHotelBranding(hotelId)
                loadTVApps(hotelId)
                loadWeather(hotelId)
            }
        } else {
            // Request pairing code
            requestPairingCode()
        }
    }

    private fun startClock() {
        val handler = android.os.Handler(android.os.Looper.getMainLooper())
        val runnable = object : Runnable {
            override fun run() {
                val calendar = java.util.Calendar.getInstance()
                val hour = calendar.get(java.util.Calendar.HOUR)
                val minute = calendar.get(java.util.Calendar.MINUTE)
                val amPm = if (calendar.get(java.util.Calendar.AM_PM) == 0) "AM" else "PM"
                
                timeText.text = String.format("%02d:%02d %s", hour, minute, amPm)
                dateText.text = android.text.format.DateFormat.format("EEEE, MMMM dd yyyy", calendar)
                
                handler.postDelayed(this, 1000)
            }
        }
        handler.post(runnable)
    }

    private fun handleKeyEvent(keyCode: Int, event: KeyEvent?): Boolean {
        if (event?.action == KeyEvent.ACTION_DOWN) {
            when (keyCode) {
                KeyEvent.KEYCODE_DPAD_LEFT,
                KeyEvent.KEYCODE_DPAD_RIGHT -> {
                    // Navigate apps
                    return true
                }
                KeyEvent.KEYCODE_DPAD_UP -> {
                    // Show settings button
                    return true
                }
                KeyEvent.KEYCODE_DPAD_CENTER,
                KeyEvent.KEYCODE_ENTER -> {
                    // Select app
                    val currentAdapter = recyclerView.adapter as? AppAdapter
                    currentAdapter?.let { adapter ->
                        val app = appsList.getOrNull(selectedPosition)
                        app?.let { launchApp(it) }
                    }
                    return true
                }
                KeyEvent.KEYCODE_MENU -> {
                    // Open settings
                    showSettingsDialog()
                    return true
                }
            }
        }
        return false
    }

    private fun showSettingsDialog() {
        // Show password dialog first
        val builder = AlertDialog.Builder(this)
        builder.setTitle("Enter Password")
        
        val input = EditText(this)
        input.inputType = android.text.InputType.TYPE_CLASS_NUMBER or 
                         android.text.InputType.TYPE_TEXT_VARIATION_PASSWORD
        builder.setView(input)
        
        builder.setPositiveButton("OK") { dialog, _ ->
            val password = input.text.toString()
            val savedPassword = getSharedPreferences("hotel_settings", MODE_PRIVATE)
                .getString("settings_password", SETTINGS_PASSWORD_DEFAULT) 
                ?: SETTINGS_PASSWORD_DEFAULT
            
            if (password == savedPassword) {
                showSettingsMenu()
            } else {
                Toast.makeText(this, "Incorrect password", Toast.LENGTH_SHORT).show()
            }
            dialog.dismiss()
        }
        
        builder.setNegativeButton("Cancel") { dialog, _ ->
            dialog.cancel()
        }
        
        builder.show()
    }

    private fun showSettingsMenu() {
        val items = arrayOf("Change CMS URL", "Change Password", "Reset Pairing", "About")
        AlertDialog.Builder(this)
            .setTitle("Settings")
            .setItems(items) { _, which ->
                when (which) {
                    0 -> changeCMSUrl()
                    1 -> changePassword()
                    2 -> resetPairing()
                    3 -> showAbout()
                }
            }
            .show()
    }

    private fun changeCMSUrl() {
        val builder = AlertDialog.Builder(this)
        builder.setTitle("Change CMS URL")
        
        val input = EditText(this)
        input.setText(PreferencesManager.getCMSUrl(this))
        input.inputType = android.text.InputType.TYPE_CLASS_TEXT
        builder.setView(input)
        
        builder.setPositiveButton("Save") { dialog, _ ->
            val url = input.text.toString()
            PreferencesManager.setCMSUrl(this, url)
            Toast.makeText(this, "CMS URL updated to: $url", Toast.LENGTH_SHORT).show()
            dialog.dismiss()
        }
        
        builder.setNegativeButton("Cancel") { dialog, _ ->
            dialog.cancel()
        }
        
        builder.show()
    }

    private fun changePassword() {
        val builder = AlertDialog.Builder(this)
        builder.setTitle("Change Settings Password")
        
        val input = EditText(this)
        input.inputType = android.text.InputType.TYPE_CLASS_NUMBER
        builder.setView(input)
        
        builder.setPositiveButton("Save") { dialog, _ ->
            val newPassword = input.text.toString()
            if (newPassword.length >= 4) {
                PreferencesManager.setSettingsPassword(this, newPassword)
                Toast.makeText(this, "Password changed successfully", Toast.LENGTH_SHORT).show()
            } else {
                Toast.makeText(this, "Password must be at least 4 digits", Toast.LENGTH_SHORT).show()
            }
            dialog.dismiss()
        }
        
        builder.setNegativeButton("Cancel") { dialog, _ ->
            dialog.cancel()
        }
        
        builder.show()
    }

    private fun resetPairing() {
        PreferencesManager.clearPairingData(this)
        Toast.makeText(this, "Pairing data cleared. Requesting new code...", Toast.LENGTH_SHORT).show()
        deviceCodeText.text = "Device: ${PreferencesManager.getDeviceId(this)}"
        pairingStatusText.text = "Waiting for pairing..."
        requestPairingCode()
    }

    private fun showAbout() {
        AlertDialog.Builder(this)
            .setTitle("Hotel TV Launcher")
            .setMessage("Version 1.0\n© 2024 Hotel TV System")
            .setPositiveButton("OK", null)
            .show()
    }
}
