import 'package:flutter/widgets.dart';
import 'package:just_audio/just_audio.dart';

/// Soft looping piano for the Music Education showcase field.
const kMusicEducationSlug = 'music-education';
const kMusicEducationAmbienceAsset = 'assets/audio/music-education-piano.mp3';
const kMusicEducationAmbienceVolume = 0.16;

/// Owns quiet looping ambience for Music Education; pause when the app backgrounds.
class ShowcaseAmbienceController with WidgetsBindingObserver {
  AudioPlayer? _player;
  var _active = false;

  Future<void> startIfMusicColumn(String? slug) async {
    if (_active || slug != kMusicEducationSlug) return;
    _active = true;
    WidgetsBinding.instance.addObserver(this);
    final player = AudioPlayer();
    _player = player;
    try {
      await player.setAsset(kMusicEducationAmbienceAsset);
      await player.setLoopMode(LoopMode.one);
      await player.setVolume(kMusicEducationAmbienceVolume);
      await player.play();
    } catch (_) {
      await dispose();
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    final player = _player;
    if (player == null) return;
    if (state == AppLifecycleState.resumed) {
      player.play();
    } else {
      player.pause();
    }
  }

  Future<void> dispose() async {
    if (_active) {
      WidgetsBinding.instance.removeObserver(this);
      _active = false;
    }
    final player = _player;
    _player = null;
    if (player == null) return;
    try {
      await player.stop();
    } catch (_) {}
    await player.dispose();
  }
}
