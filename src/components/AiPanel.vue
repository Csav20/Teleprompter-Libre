<script setup lang="ts">
import { ref, computed } from 'vue'
import { state, rebuildNorm } from '../store'
import { ai, MODELS, PRESETS, runEdit, AiError } from '../ai/claude'

const presetId = ref(PRESETS[0]!.id)
const preset = computed(() => PRESETS.find((p) => p.id === presetId.value)!)
const arg = ref('')
const result = ref('')
const error = ref('')
const busy = ref(false)
const undoScript = ref<string | null>(null)
let controller: AbortController | null = null

function onPreset() {
  arg.value = preset.value.arg?.default ?? ''
}

async function run() {
  if (!state.script.trim()) {
    error.value = 'Primero escribe o importa un guion.'
    return
  }
  error.value = ''
  result.value = ''
  busy.value = true
  controller = new AbortController()
  try {
    result.value = await runEdit({
      script: state.script,
      instruction: preset.value.instruction(arg.value.trim(), { wpm: state.wpm }),
      onText: (s) => (result.value = s),
      signal: controller.signal,
    })
  } catch (e) {
    error.value = e instanceof AiError ? e.message : String(e)
  } finally {
    busy.value = false
    controller = null
  }
}

function cancel() {
  controller?.abort()
}

function apply(mode: 'replace' | 'append') {
  undoScript.value = state.script
  state.script = mode === 'replace' ? result.value : state.script.trimEnd() + '\n\n' + result.value
  rebuildNorm()
  result.value = ''
}

function undo() {
  if (undoScript.value === null) return
  state.script = undoScript.value
  rebuildNorm()
  undoScript.value = null
}
</script>

<template>
  <div class="ai">
    <div class="field">
      <label>API key de Anthropic</label>
      <input type="password" v-model="ai.key" placeholder="sk-ant-..." autocomplete="off" spellcheck="false" />
      <label class="check">
        <input type="checkbox" v-model="ai.remember" />
        Recordar en este navegador
      </label>
      <p class="hint">
        La clave se envía sólo a api.anthropic.com. Sin «recordar», se borra al cerrar la pestaña. Usa una clave con
        límite de gasto y no la guardes en un computador compartido.
      </p>
    </div>

    <div class="field">
      <label>Modelo</label>
      <select v-model="ai.model">
        <option v-for="m in MODELS" :key="m.id" :value="m.id">{{ m.label }}</option>
      </select>
    </div>

    <div class="field">
      <label>Acción</label>
      <select v-model="presetId" @change="onPreset">
        <option v-for="p in PRESETS" :key="p.id" :value="p.id">{{ p.label }}</option>
      </select>
      <input v-if="preset.arg" v-model="arg" :placeholder="preset.arg.placeholder" />
    </div>

    <div class="row2">
      <button class="wide primary" :disabled="busy || !ai.key" @click="run">
        {{ busy ? 'Generando…' : 'Aplicar al guion' }}
      </button>
      <button v-if="busy" class="wide" @click="cancel">Cancelar</button>
      <button v-else-if="undoScript !== null" class="wide" @click="undo">Deshacer</button>
    </div>

    <p v-if="error" class="hint warn">{{ error }}</p>

    <template v-if="result">
      <textarea class="result" :value="result" readonly></textarea>
      <div v-if="!busy" class="row2">
        <button class="wide primary" @click="apply('replace')">Reemplazar guion</button>
        <button class="wide" @click="apply('append')">Agregar al final</button>
        <button class="wide" @click="result = ''">Descartar</button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.ai {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.field label {
  font-size: 12px;
  color: var(--text-dim);
}
input:not([type='checkbox']),
select,
.result {
  width: 100%;
  box-sizing: border-box;
  background: var(--bg-input);
  color: var(--text);
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  padding: 7px 9px;
  font-size: 13px;
}
.check {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text);
}
.result {
  height: 160px;
  resize: vertical;
  line-height: 1.5;
}
.row2 {
  display: flex;
  gap: 8px;
}
button.wide {
  flex: 1;
  padding: 8px;
  border-radius: 8px;
  border: 1px solid var(--border-soft);
  background: var(--bg-input);
  color: var(--text);
  cursor: pointer;
  font-size: 13px;
}
button.primary {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--accent-text);
}
button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.hint {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-dim);
}
.hint.warn {
  color: #ff8a65;
}
</style>
