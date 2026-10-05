type ApiBaseUrlOptions = {
  demoMode: boolean
  configuredBaseUrl?: string
  isDev: boolean
}

export function resolveApiBaseUrl({ demoMode, configuredBaseUrl, isDev }: ApiBaseUrlOptions): string {
  if (demoMode) return ''
  if (configuredBaseUrl?.trim()) return configuredBaseUrl.trim().replace(/\/+$/, '')
  return isDev ? 'http://127.0.0.1:8002' : ''
}
