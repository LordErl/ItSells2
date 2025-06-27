import { supabase, TABLES, USER_ROLES, dbHelpers } from '../lib/supabase'
import { ImageUploadService } from './imageUploadService'

export const AuthService = {

  // Login with CPF and password
  async loginWithCredentials(cpf, password) {
    try {
      // First, get user by CPF
      const { data: userData, error: userError } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .eq('cpf', cpf)
        .single()

      if (userError || !userData) {
        throw new Error('CPF não encontrado')
      }

      // Check if user has password set
      if (!userData.password) {
        throw new Error('Usuário não possui senha cadastrada. Use reconhecimento facial ou cadastre uma senha.')
      }

      // For demo purposes, we'll use a simple password check
      // In production, use proper password hashing
      if (userData.password !== password) {
        throw new Error('Senha incorreta')
      }

      // Create session token
      const sessionToken = await this.createSession(userData)

      // Remove password from response
      const { password: _, ...userWithoutPassword } = userData

      return {
        success: true,
        data: {
          user: userWithoutPassword,
          token: sessionToken
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Erro no login'
      }
    }
  },

  // Login with face recognition
  async loginWithFace(imageFile) {
    try {
      if (!imageFile) {
        throw new Error('Imagem não fornecida')
      }

      // Get all users with face data
      const { data: usersWithFaces, error: usersError } = await supabase
        .from(TABLES.USERS)
        .select('id, name, cpf, photo_url, role')
        .not('photo_url', 'is', null)
        .eq('active', true)

      if (usersError) {
        throw new Error('Erro ao buscar usuários com reconhecimento facial')
      }

      if (!usersWithFaces || usersWithFaces.length === 0) {
        throw new Error('Nenhum usuário com reconhecimento facial cadastrado')
      }

      // In a real implementation, you would:
      // 1. Extract face encoding from the input image
      // 2. Compare with stored face encodings
      // 3. Find the best match above a threshold
      
      // For demo purposes, we'll simulate face recognition
      const recognizedUser = await this.simulateFaceRecognition(imageFile, usersWithFaces)

      if (!recognizedUser) {
        throw new Error('Rosto não reconhecido. Tente novamente ou use CPF e senha.')
      }

      // Create session token
      const sessionToken = await this.createSession(recognizedUser)

      return {
        success: true,
        data: {
          user: recognizedUser,
          token: sessionToken
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Erro no reconhecimento facial'
      }
    }
  },

  // Register with photo upload (corrected version)
  async registerWithPhoto(userData, photoFile) {
    try {
      const { cpf, name, email, password } = userData

      // Validate required fields
      if (!cpf || !name) {
        throw new Error('CPF e nome são obrigatórios')
      }

      // Validate CPF
      if (!this.validateCPF(cpf)) {
        throw new Error('CPF inválido')
      }

      // Check if CPF already exists
      const { data: existingUser } = await supabase
        .from(TABLES.USERS)
        .select('id')
        .eq('cpf', cpf)
        .single()

      if (existingUser) {
        throw new Error('CPF já cadastrado')
      }

      // Generate unique user ID
      const userId = crypto.randomUUID()

      // Upload photo if provided
      let photoData = null
      if (photoFile) {
        try {
          photoData = await ImageUploadService.processAndUploadPhoto(
            photoFile, 
            userId, 
            'profile'
          )
          console.log('Photo uploaded successfully:', photoData)
        } catch (uploadError) {
          console.error('Photo upload failed:', uploadError)
          // Continue without photo if upload fails
        }
      }

      // Prepare user data
      const newUserData = {
        id: userId,
        name: name.trim(),
        cpf: cpf.replace(/\D/g, ''), // Store only numbers
        role: 'customer',
        photo_url: photoData?.url || null,
        photo_path: photoData?.path || null,
        active: true,
        created_at: new Date().toISOString()
      }

      // Add optional fields if provided
      if (email && email.trim()) {
        newUserData.email = email.trim().toLowerCase()
      }

      if (password && password.trim()) {
        // In production, hash the password
        newUserData.password = password.trim()
      }

      // Insert user into database
      const { data: createdUser, error: insertError } = await supabase
        .from(TABLES.USERS)
        .insert([newUserData])
        .select()
        .single()

      if (insertError) {
        console.error('Database insert error:', insertError)
        throw new Error('Erro ao criar usuário: ' + insertError.message)
      }

      // Create customer account
      await this.createCustomerAccount(userId)

      // Store face data if photo was uploaded
      if (photoData) {
        await this.storeFaceData(userId, photoData.url)
      }

      // Create session token
      const sessionToken = await this.createSession(createdUser)

      return {
        success: true,
        data: {
          user: createdUser,
          token: sessionToken,
          photoUploaded: !!photoData
        }
      }
    } catch (error) {
      console.error('Registration error:', error)
      return {
        success: false,
        error: error.message || 'Erro ao criar conta'
      }
    }
  },

  // Update user with optional email and password
  async updateUserCredentials(userId, email, password) {
    try {
      const updates = {
        updated_at: new Date().toISOString()
      }

      if (email && email.trim()) {
        updates.email = email.trim().toLowerCase()
      }

      if (password && password.trim()) {
        // In production, hash the password
        updates.password = password.trim()
      }

      const { data: updatedUser, error } = await supabase
        .from(TABLES.USERS)
        .update(updates)
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        throw error
      }

      return {
        success: true,
        data: updatedUser
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Erro ao atualizar credenciais'
      }
    }
  },

  // Simulate face recognition (replace with real implementation)
  async simulateFaceRecognition(imageFile, usersWithFaces) {
    try {
      // In a real implementation, you would:
      // 1. Use face-api.js or similar library
      // 2. Extract face descriptors from the input image
      // 3. Compare with stored descriptors
      // 4. Return the best match above a confidence threshold

      // For demo purposes, we'll return a random user
      // In production, replace this with actual face recognition
      
      console.log('Simulating face recognition for', usersWithFaces.length, 'users')
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // For demo: return the first user (in production, this would be the matched user)
      if (usersWithFaces.length > 0) {
        return usersWithFaces[0]
      }
      
      return null
    } catch (error) {
      console.error('Face recognition simulation error:', error)
      return null
    }
  },

  // Verify session token
  async verifyToken(token) {
    try {
      if (!token || !token.startsWith('session_')) {
        return false
      }

      const userId = token.split('_')[1]
      
      const { data: user, error } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .eq('id', userId)
        .eq('active', true)
        .single()

      return !error && user
    } catch (error) {
      return false
    }
  },

  // Get user by ID
  async getUserById(userId) {
    try {
      const { data: user, error } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        throw error
      }

      return { success: true, data: user }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Usuário não encontrado'
      }
    }
  },

  // Update user data
  async updateUser(userId, updates) {
    try {
      const { data: user, error } = await supabase
        .from(TABLES.USERS)
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        throw error
      }

      return { success: true, data: user }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Erro ao atualizar usuário'
      }
    }
  },

  // Create session token
  async createSession(user) {
    return `session_${user.id}_${Date.now()}`
  },

  // Store face data for recognition
  async storeFaceData(userId, photoUrl) {
    try {
      // In production, extract face encodings from photo
      const faceEncoding = await this.extractFaceEncoding(photoUrl)

      const { error } = await supabase
        .from(TABLES.FACE_DATA)
        .insert([{
          user_id: userId,
          face_encoding: faceEncoding,
          photo_url: photoUrl,
          created_at: new Date().toISOString()
        }])

      if (error) {
        console.error('Error storing face data:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error storing face data:', error)
      return false
    }
  },

  // Create customer account
  async createCustomerAccount(userId) {
    try {
      const { error } = await supabase
        .from(TABLES.CUSTOMER_ACCOUNTS)
        .insert([{
          user_id: userId,
          current_bill: 0,
          total_spent: 0,
          visit_count: 0,
          created_at: new Date().toISOString()
        }])

      if (error) {
        console.error('Error creating customer account:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error creating customer account:', error)
      return false
    }
  },

  // Extract face encoding (mock implementation)
  async extractFaceEncoding(photoUrl) {
    // In production, use face-api.js or similar library
    return `face_encoding_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  },

  // Validate CPF
  validateCPF(cpf) {
    cpf = cpf.replace(/[^\d]/g, '')
    
    if (cpf.length !== 11) return false
    if (/^(\d)\1{10}$/.test(cpf)) return false
    
    let sum = 0
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i)
    }
    
    let remainder = 11 - (sum % 11)
    if (remainder === 10 || remainder === 11) remainder = 0
    if (remainder !== parseInt(cpf.charAt(9))) return false
    
    sum = 0
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i)
    }
    
    remainder = 11 - (sum % 11)
    if (remainder === 10 || remainder === 11) remainder = 0
    if (remainder !== parseInt(cpf.charAt(10))) return false
    
    return true
  },

  // Logout
  async logout() {
    try {
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error.message 
      }
    }
  }
}

