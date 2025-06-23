/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  const component: DefineComponent<Record<string, never>, Record<string, never>, any>
  export default component
}

// Web Bluetooth API types
interface Navigator {
  bluetooth: Bluetooth
}

interface Bluetooth {
  requestDevice(options: RequestDeviceOptions): Promise<BluetoothDevice>
  getAvailability(): Promise<boolean>
}

interface RequestDeviceOptions {
  filters?: BluetoothLEScanFilter[]
  optionalServices?: BluetoothServiceUUID[]
  acceptAllDevices?: boolean
}

interface BluetoothLEScanFilter {
  services?: BluetoothServiceUUID[]
  name?: string
  namePrefix?: string
}

interface BluetoothDevice {
  id: string
  name?: string
  gatt?: BluetoothRemoteGATTServer
  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void
}

interface BluetoothRemoteGATTServer {
  connected: boolean
  device: BluetoothDevice
  connect(): Promise<BluetoothRemoteGATTServer>
  disconnect(): void
  getPrimaryService(service: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService>
}

interface BluetoothRemoteGATTService {
  device: BluetoothDevice
  uuid: string
  getCharacteristic(
    characteristic: BluetoothCharacteristicUUID,
  ): Promise<BluetoothRemoteGATTCharacteristic>
}

interface BluetoothRemoteGATTCharacteristic {
  service: BluetoothRemoteGATTService
  uuid: string
  value?: DataView
  readValue(): Promise<DataView>
  writeValue(value: BufferSource): Promise<void>
  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void
  startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>
  stopNotifications(): Promise<BluetoothRemoteGATTCharacteristic>
}

type BluetoothServiceUUID = string
type BluetoothCharacteristicUUID = string

// Web Authentication API extensions
interface CredentialCreationOptions {
  publicKey?: PublicKeyCredentialCreationOptions
}

interface CredentialRequestOptions {
  publicKey?: PublicKeyCredentialRequestOptions
}

interface PublicKeyCredentialCreationOptions {
  challenge: BufferSource
  rp: PublicKeyCredentialRpEntity
  user: PublicKeyCredentialUserEntity
  pubKeyCredParams: PublicKeyCredentialParameters[]
  authenticatorSelection?: AuthenticatorSelectionCriteria
  timeout?: number
  attestation?: AttestationConveyancePreference
}

interface PublicKeyCredentialRequestOptions {
  challenge: BufferSource
  timeout?: number
  allowCredentials?: PublicKeyCredentialDescriptor[]
  userVerification?: UserVerificationRequirement
}

interface PublicKeyCredential extends Credential {
  rawId: ArrayBuffer
  response: AuthenticatorResponse
}

interface AuthenticatorAttestationResponse extends AuthenticatorResponse {
  attestationObject: ArrayBuffer
}

interface AuthenticatorAssertionResponse extends AuthenticatorResponse {
  authenticatorData: ArrayBuffer
  signature: ArrayBuffer
  userHandle: ArrayBuffer | null
}

interface AuthenticatorResponse {
  clientDataJSON: ArrayBuffer
}

type AttestationConveyancePreference = 'none' | 'indirect' | 'direct'
type UserVerificationRequirement = 'required' | 'preferred' | 'discouraged'

interface PublicKeyCredentialRpEntity {
  id?: string
  name: string
}

interface PublicKeyCredentialUserEntity {
  id: BufferSource
  name: string
  displayName: string
}

interface PublicKeyCredentialParameters {
  type: PublicKeyCredentialType
  alg: COSEAlgorithmIdentifier
}

interface AuthenticatorSelectionCriteria {
  authenticatorAttachment?: AuthenticatorAttachment
  requireResidentKey?: boolean
  userVerification?: UserVerificationRequirement
}

interface PublicKeyCredentialDescriptor {
  type: PublicKeyCredentialType
  id: BufferSource
  transports?: AuthenticatorTransport[]
}

type PublicKeyCredentialType = 'public-key'
type COSEAlgorithmIdentifier = number
type AuthenticatorAttachment = 'platform' | 'cross-platform'
type AuthenticatorTransport = 'usb' | 'nfc' | 'ble' | 'internal'
