/** Resolve browser coordinates to a readable place name for admin forms. */
export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  const url =
    `https://api.bigdatacloud.net/data/reverse-geocode-client` +
    `?latitude=${encodeURIComponent(String(lat))}` +
    `&longitude=${encodeURIComponent(String(lon))}` +
    `&localityLanguage=en`

  const response = await fetch(url)
  if (!response.ok) throw new Error('Could not look up that location.')

  const data = (await response.json()) as {
    locality?: string
    city?: string
    principalSubdivision?: string
    countryName?: string
    localityInfo?: { administrative?: Array<{ name?: string }> }
  }

  const parts = [
    data.locality || data.city,
    data.principalSubdivision,
    data.countryName === 'Botswana' ? 'Botswana' : data.countryName,
  ].filter((part, index, arr) => part && arr.indexOf(part) === index)

  if (parts.length) return parts.join(', ')

  const admin = data.localityInfo?.administrative?.map((item) => item.name).filter(Boolean)
  if (admin?.length) return admin.slice(0, 3).join(', ')

  return `${lat.toFixed(4)}, ${lon.toFixed(4)}`
}

export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('This browser does not support location.'))
      return
    }
    navigator.geolocation.getCurrentPosition(resolve, (error) => {
      if (error.code === error.PERMISSION_DENIED) {
        reject(new Error('Location permission was denied. Allow location access and try again.'))
        return
      }
      if (error.code === error.POSITION_UNAVAILABLE) {
        reject(new Error('Location is unavailable right now.'))
        return
      }
      reject(new Error('Could not get your current location.'))
    }, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 60000,
    })
  })
}

export async function resolveCurrentLocationLabel(): Promise<string> {
  const position = await getCurrentPosition()
  return reverseGeocode(position.coords.latitude, position.coords.longitude)
}
