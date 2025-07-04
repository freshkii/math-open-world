import { config, audios } from '../constants.js'

class AudioManager {
  constructor(soundVolume = 0.7, musicVolume = 0.7, muted = false) {
    this.soundVolume = soundVolume
    this.musicVolume = musicVolume
    this.muted = muted

    this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
    this.sounds = new Map()
    this.activeSounds = new Map()
    this.decodePromises = new Map()
    this.music = null

	  document.addEventListener('click', () => this.unlockAudio())
  }

  getOrCreateScene(scene) {
    if (!this.sounds.has(scene)) {
      this.sounds.set(scene, new Map())
    }
    return this.sounds.get(scene)
  }

  decodeAudioData(scene, key, arrayBuffer) {
    const cacheKey = `${scene}:${key}`

    if (this.decodePromises.has(cacheKey)) {
      return this.decodePromises.get(cacheKey)
    }

    const promise = this.audioContext.decodeAudioData(arrayBuffer)
      .then(decodedBuffer => {
        this.decodePromises.delete(cacheKey)
        return decodedBuffer
      })
      .catch(err => {
        console.error('Error decoding audio ' + cacheKey, err)
        this.decodePromises.delete(cacheKey)
        return null
      })

    this.decodePromises.set(cacheKey, promise)
    return promise
  }

  playBuffer(buffer, volume = 1, loop = false) {
    if (!this.audioContext || this.muted) return null

    var source = this.audioContext.createBufferSource()
    var gainNode = this.audioContext.createGain()

    source.buffer = buffer
    source.loop = loop
    source.connect(gainNode)
    gainNode.connect(this.audioContext.destination)
    gainNode.gain.value = Math.pow(volume * this.soundVolume, 3)

    source.start()

    return { source, gainNode }
  }

  async loadSound(scene, key, src, loop = false) {
    var sceneMap = this.getOrCreateScene(scene)
    try {
      var response = await fetch(config.AUDIO_DIR + src)
      var arrayBuffer = await response.arrayBuffer()
      var audioBuffer = await this.decodeAudioData(scene, key, arrayBuffer)
      if (audioBuffer) {
        sceneMap.set(key, { buffer: audioBuffer, loop })
      }
      return audioBuffer
    } catch (e) {
      console.error('Error loading sound ' + scene + ':' + key, e)
      return null
    }
  }

  async preloadSounds(scene, soundList) {
    await Promise.all(soundList.map(sound => {
      return this.loadSound(scene, sound.key, sound.src, sound.loop || false)
    }))
  }

  playSound(scene, key, volume = 1) {
    var sceneMap = this.sounds.get(scene)
    if (!sceneMap) {
      console.error('Scene not found: ' + scene)
      return null
    }

    var sound = sceneMap.get(key)
    if (!sound) {
      console.error('Sound not found: ' + key + ' in scene ' + scene)
      return null
    }

    var instanceId = scene + ':' + key + ':' + performance.now()
    var audioNodes = this.playBuffer(sound.buffer, volume, sound.loop)

    if (audioNodes) {
      this.activeSounds.set(instanceId, {
        source: audioNodes.source,
        gainNode: audioNodes.gainNode,
        scene,
        key,
        ended: false
      })

      audioNodes.source.addEventListener('ended', () => {
        var instance = this.activeSounds.get(instanceId)
        if (instance) {
          instance.ended = true
          this.activeSounds.delete(instanceId)
        }
      })

      return instanceId
    }

    return null
  }

  isSoundPlaying(scene, key) {
    for (var [, instance] of this.activeSounds) {
      if (instance.scene === scene && instance.key === key && !instance.ended) {
        return true
      }
    }
    return false
  }

  playSoundForDuration(scene, key, durationMs, volume = 1) {
    var instanceId = this.playSound(scene, key, volume)
    if (!instanceId) return
    setTimeout(() => {
      this.endSoundInstance(instanceId)
    }, durationMs)
  }

  endSoundInstance(instanceId) {
    var instance = this.activeSounds.get(instanceId)
    if (instance && !instance.ended) {
      instance.source.stop()
      this.activeSounds.delete(instanceId)
    }
  }

  endSound(scene, key) {
    for (var [id, instance] of this.activeSounds) {
      if (instance.scene === scene && instance.key === key) {
        instance.source.stop()
        this.activeSounds.delete(id)
      }
    }
  }

  async playMusic(scene, key, volume = 1) {
    if (this.music) {
      this.music.pause()
      this.music = null
    }

    var sceneMap = this.sounds.get(scene)
    if (!sceneMap) {
      console.error('Scene not found: ' + scene)
      return
    }

    var sound = sceneMap.get(key)
    if (!sound) {
      console.error('Music not found: ' + key + ' in scene ' + scene)
      return
    }

    var blob = new Blob([sound.buffer])
    this.music = new Audio()
    this.music.src = URL.createObjectURL(blob)
    this.music.volume = volume * this.musicVolume
    this.music.loop = true
    this.music.muted = this.muted

    this.music.play().catch(e => {
      console.error('Music playback failed', e)
    })
  }

  setMusicVolume(volume) {
	volume = Math.max(0, Math.min(1, Number(volume)))

	this.musicVolume = volume
	if (this.music) {
	  this.music.volume = volume
	}
  }

  setSoundVolume(volume) {
	  volume = Math.max(0, Math.min(1, Number(volume)))
	  
	  this.musicVolume = volume
	  if (this.music) {
		this.music.volume = volume
	  }
  }

  toggleMute() {
    this.muted = !this.muted
    if (this.music) {
      this.music.muted = this.muted
    }

    if (this.audioContext) {
      this.audioContext.suspend().then(() => {
        if (!this.muted) {
          this.audioContext.resume()
        }
      })
    }

    return this.muted
  }

  stopMusic() {
    if (this.music) {
      this.music.pause()
      this.music.currentTime = 0
      this.music = null
    }
  }

  pauseAll() {
    if (this.music) {
      this.music.pause()
    }
    if (this.audioContext) {
      this.audioContext.suspend()
    }
  }

  resumeAll() {
    if (!this.muted) {
      if (this.music && this.music.paused) {
        this.music.play().catch(e => {
          console.error('Music resume failed', e)
        })
      }
      if (this.audioContext) {
        this.audioContext.resume()
      }
    }
  }

  async loadAudios() {
    const scenes = Object.entries(audios)
    for (var i = 0; i < scenes.length; i++) {
      const [scene, soundList] = scenes[i]
      await this.preloadSounds(scene, soundList)
    }
  }

  destroy() {
    this.stopMusic()
    for (var instance of this.activeSounds.values()) {
      instance.source.stop()
    }
    this.activeSounds.clear()
    if (this.audioContext) {
      this.audioContext.close()
    }
  }

// browser is annoying
  unlockAudio() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
	  this.audioContext.resume()
    }
  }
}

export { AudioManager }
