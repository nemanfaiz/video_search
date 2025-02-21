import axios from 'axios'

export const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

function getCsrfToken() {
  const name = 'csrftoken'
  let cookieValue = null
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';')
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim()
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1))
        break
      }
    }
  }
  return cookieValue
}

const client = axios.create({
  baseURL,
  withCredentials: true, 
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
})

client.interceptors.request.use((config) => {
  const csrfToken = getCsrfToken()
  
  if (csrfToken) {
    config.headers['X-CSRFToken'] = csrfToken
  }

  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }

  return config
})

client.interceptors.response.use(
  (response) => response,
  (error) => {

    if (error.response) {

      console.error('Response error:', error.response.data)
    } else if (error.request) {

      console.error('Request error:', error.request)
    } else {

      console.error('Error:', error.message)
    }
    return Promise.reject(error)
  }
)

export default client