package com.hotel.tvlauncher

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide

data class AppItem(
    val id: Int,
    val name: String,
    val iconResId: Int? = null,
    val iconUrl: String? = null
)

class AppAdapter(
    private val apps: List<AppItem>,
    private val onItemClick: (AppItem) -> Unit
) : RecyclerView.Adapter<AppAdapter.AppViewHolder>() {

    inner class AppViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val appIcon: ImageView = itemView.findViewById(R.id.appIcon)
        val appName: TextView = itemView.findViewById(R.id.appName)
        
        init {
            itemView.setOnClickListener {
                val position = adapterPosition
                if (position != RecyclerView.NO_POSITION) {
                    onItemClick(apps[position])
                }
            }
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): AppViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_app, parent, false)
        return AppViewHolder(view)
    }

    override fun onBindViewHolder(holder: AppViewHolder, position: Int) {
        val app = apps[position]
        holder.appName.text = app.name
        
        if (app.iconUrl != null) {
            Glide.with(holder.itemView.context)
                .load(app.iconUrl)
                .into(holder.appIcon)
        } else if (app.iconResId != null) {
            holder.appIcon.setImageResource(app.iconResId)
        }
        
        // Highlight selected item
        if (position == 0) {
            holder.itemView.isSelected = true
        }
    }

    override fun getItemCount() = apps.size
    
    fun updateApps(newApps: List<AppItem>) {
        // Update logic here
    }
}
