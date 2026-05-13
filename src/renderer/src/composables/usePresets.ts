import { ref, type Ref } from 'vue'
import type { DataFormat } from '@/types'

export interface PresetData {
  presets: string[]
  presetFormats: DataFormat[]
  presetDelays: number[]
  presetSelected: boolean[]
}

export function usePresets() {
  const presets: Ref<string[]> = ref(Array(99).fill(''))
  const presetFormats: Ref<DataFormat[]> = ref(Array(99).fill('hex'))
  const presetDelays: Ref<number[]> = ref(Array(99).fill(0))
  const presetSelected: Ref<boolean[]> = ref(Array(99).fill(false))
  const isLoading: Ref<boolean> = ref(false)

  async function loadPresets(): Promise<void> {
    if (!window.electronAPI?.config) return

    isLoading.value = true
    try {
      const savedPresets = await window.electronAPI.config.get('presets')
      if (savedPresets && savedPresets.length === 99) {
        presets.value = savedPresets
      }

      const savedFormats = await window.electronAPI.config.get('presetFormats')
      if (savedFormats && savedFormats.length === 99) {
        presetFormats.value = savedFormats
      }

      const savedDelays = await window.electronAPI.config.get('presetDelays')
      if (savedDelays && savedDelays.length === 99) {
        presetDelays.value = savedDelays
      }

      const savedSelected = await window.electronAPI.config.get('presetSelected')
      if (savedSelected && savedSelected.length === 99) {
        presetSelected.value = savedSelected
      }
    } catch (e) {
      console.error('Failed to load presets:', e)
    } finally {
      isLoading.value = false
    }
  }

  async function savePresets(): Promise<void> {
    if (!window.electronAPI?.config) return

    try {
      await window.electronAPI.config.set('presets', JSON.parse(JSON.stringify(presets.value)))
      await window.electronAPI.config.set('presetFormats', JSON.parse(JSON.stringify(presetFormats.value)))
      await window.electronAPI.config.set('presetDelays', JSON.parse(JSON.stringify(presetDelays.value)))
      await window.electronAPI.config.set('presetSelected', JSON.parse(JSON.stringify(presetSelected.value)))
    } catch (e) {
      console.error('Failed to save presets:', e)
    }
  }

  function clearAllPresets(): void {
    presets.value = Array(99).fill('')
    presetFormats.value = Array(99).fill('hex')
    presetDelays.value = Array(99).fill(0)
    presetSelected.value = Array(99).fill(false)
    savePresets()
  }

  function updatePreset(index: number, data: string, format: DataFormat, delay: number, selected: boolean): void {
    if (index >= 0 && index < 99) {
      presets.value[index] = data
      presetFormats.value[index] = format
      presetDelays.value[index] = delay
      presetSelected.value[index] = selected
    }
  }

  function getPreset(index: number): { data: string; format: DataFormat; delay: number; selected: boolean } {
    if (index >= 0 && index < 99) {
      return {
        data: presets.value[index],
        format: presetFormats.value[index],
        delay: presetDelays.value[index],
        selected: presetSelected.value[index]
      }
    }
    return { data: '', format: 'hex', delay: 0, selected: false }
  }

  function getSelectedIndices(): number[] {
    return presetSelected.value
      .map((selected, idx) => selected ? idx : -1)
      .filter(idx => idx !== -1)
  }

  return {
    presets,
    presetFormats,
    presetDelays,
    presetSelected,
    isLoading,
    loadPresets,
    savePresets,
    clearAllPresets,
    updatePreset,
    getPreset,
    getSelectedIndices
  }
}
