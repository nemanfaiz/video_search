export const validateUsername = (username: string): string | null => {
    if (username.length < 3) {
      return 'Username must be at least 3 characters long'
    }
    if (username.length > 30) {
      return 'Username cannot exceed 30 characters'
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return 'Username can only contain letters, numbers, and underscores'
    }
    return null
  }
  
  export const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long'
    }
    if (password.length > 128) {
      return 'Password cannot exceed 128 characters'
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter'
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter'
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number'
    }
    return null
  }
  
  export const validateEmail = (email: string): string | null => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address'
    }
    return null
  }
  
  export const validateName = (name: string): string | null => {
    if (name && name.length > 50) {
      return 'Name cannot exceed 50 characters'
    }
    if (name && !/^[a-zA-Z\s-']+$/.test(name)) {
      return 'Name can only contain letters, spaces, hyphens, and apostrophes'
    }
    return null
  }