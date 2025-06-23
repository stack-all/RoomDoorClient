export interface BluetoothConnectionState {
  isConnected: boolean
  isConnecting: boolean
  device: BluetoothDevice | null
  error: string | null
}

export interface LockState {
  isUnlocking: boolean
  isUnlocked: boolean
  lastUnlockTime: number | null
  connectionState: BluetoothConnectionState
}

export interface AuthMode {
  type: 'manual' | 'biometric'
  isEnabled: boolean
}

export interface BiometricCredential {
  credentialId: string
  wrappedKey: string
  iv: string
}

export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
}

export interface BluetoothServiceConfig {
  serviceUUID: string
  challengeCharacteristicUUID: string
  responseCharacteristicUUID: string
}

export interface ChallengeResponse {
  challenge: Uint8Array
  timestamp: number
}

export interface UnlockResult {
  success: boolean
  error?: string
  timestamp: number
}

export interface DeviceSettings {
  preferredDeviceId?: string
  autoConnect: boolean
  biometricEnabled: boolean
  savedPassword?: string
  mockMode: boolean
}
