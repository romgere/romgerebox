export function cloneBuffer(buffer: ArrayBuffer): ArrayBuffer {
  let tmp = new Uint8Array(buffer.byteLength)
  tmp.set(new Uint8Array(buffer), 0)
  return tmp.buffer
}
