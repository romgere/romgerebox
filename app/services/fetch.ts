import Service from '@ember/service'

export default class Fetch extends Service {
  
  async getArrayBuffer(url: string) : Promise<ArrayBuffer> {
    let response = await fetch(url)
    return response.arrayBuffer()
  }

  async getJson<T>(url: string) : Promise<T> {
    let response = await fetch(url)
    return response.json()
  }
}

declare module '@ember/service' {
  interface Registry {
    'fetch': Fetch;
  }
}
