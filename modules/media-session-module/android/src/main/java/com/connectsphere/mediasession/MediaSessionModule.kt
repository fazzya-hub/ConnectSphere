package com.connectsphere.mediasession

import android.content.ComponentName
import android.content.Context
import android.media.MediaMetadata
import android.media.session.MediaController
import android.media.session.MediaSessionManager
import android.media.session.PlaybackState
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class MediaSessionModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("MediaSessionModule")

    AsyncFunction("getCurrentTrack") {
      return@AsyncFunction getCurrentTrack()
    }
  }

  private fun getCurrentTrack(): Map<String, String>? {
    val manager = context.getSystemService(Context.MEDIA_SESSION_SERVICE) as MediaSessionManager
    val listener = ComponentName(context, MediaSessionNotificationListenerService::class.java)

    val controllers = try {
      manager.getActiveSessions(listener)
    } catch (_: SecurityException) {
      return null
    }

    val playingController = controllers.firstOrNull { controller ->
      controller.playbackState?.state == PlaybackState.STATE_PLAYING && controller.toTrack() != null
    }

    return playingController?.toTrack()
  }

  private fun MediaController.toTrack(): Map<String, String>? {
    val metadata = metadata
    val description = metadata?.description

    val title = metadata?.getString(MediaMetadata.METADATA_KEY_TITLE)
      ?: description?.title?.toString()

    val artist = metadata?.getString(MediaMetadata.METADATA_KEY_ARTIST)
      ?: metadata?.getString(MediaMetadata.METADATA_KEY_ALBUM_ARTIST)
      ?: description?.subtitle?.toString()

    val cleanTitle = title?.trim().orEmpty()
    val cleanArtist = artist?.trim().orEmpty()

    if (cleanTitle.isBlank() || cleanArtist.isBlank()) {
      return null
    }

    return mapOf(
      "title" to cleanTitle,
      "artist" to cleanArtist
    )
  }
}
